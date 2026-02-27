/**
 * Webhook Dispatcher
 *
 * Sends HTTP POST notifications to registered webhook URLs when
 * events occur (episode completion, asset generation, etc.).
 * Fire-and-forget: failures are logged but do not block the caller.
 *
 * Accepts an optional Supabase client so it can be used from both
 * API routes (with createAdminClient) and Trigger.dev jobs (with getTriggerClient).
 */

import { createAdminClient } from '@/lib/supabase/server';
import { decryptString, type EncryptedPayload } from '@/lib/buzzsprout/encryption';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'episode.completed'
  | 'episode.failed'
  | 'asset.generated';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

interface WebhookRecord {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
}

// ─── HMAC Signature ─────────────────────────────────────────────────────────

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// ─── Dispatch ───────────────────────────────────────────────────────────────

/**
 * Dispatch webhooks for a given user and event.
 * Queries active webhooks that subscribe to the event type,
 * then sends each one in parallel (fire-and-forget).
 *
 * @param userId - The user whose webhooks to dispatch
 * @param payload - The webhook event payload
 * @param client - Optional Supabase client (e.g. from Trigger.dev context).
 *                 Falls back to createAdminClient() if not provided.
 */
export async function dispatchWebhooks(
  userId: string,
  payload: WebhookPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: SupabaseClient<any, any, any>
): Promise<void> {
  try {
    const supabase = client ?? createAdminClient();

    // Fetch active webhooks for this user that listen to this event
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('id, url, events, secret, active')
      .eq('user_id', userId)
      .eq('active', true);

    if (error) {
      console.error('[Webhook Dispatcher] Failed to fetch webhooks:', error.message);
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      return;
    }

    // Filter webhooks that subscribe to this event
    const matchingWebhooks = (webhooks as WebhookRecord[]).filter(
      (wh) => wh.events.includes(payload.event)
    );

    if (matchingWebhooks.length === 0) {
      return;
    }

    const body = JSON.stringify(payload);

    // Fire all webhooks in parallel, don't await collectively
    const deliveryPromises = matchingWebhooks.map(async (webhook) => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-PodBrain-Event': payload.event,
          'User-Agent': 'PodBrain-Webhook/1.0',
        };

        // Add HMAC signature if secret is configured.
        // Secrets are stored encrypted (JSON envelope). We decrypt at
        // delivery time so the plaintext never sits in the database.
        if (webhook.secret) {
          let plaintextSecret: string;
          try {
            const parsed = JSON.parse(webhook.secret) as EncryptedPayload;
            plaintextSecret = decryptString(parsed);
          } catch {
            // Fallback: treat as plaintext for backwards-compatibility
            // with any secrets created before encryption was enabled.
            plaintextSecret = webhook.secret;
          }
          headers['X-PodBrain-Signature'] = signPayload(body, plaintextSecret);
        }

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
          console.error(
            `[Webhook Dispatcher] Delivery failed for webhook ${webhook.id}:`,
            `status=${response.status}`,
            `url=${webhook.url}`
          );
        }
      } catch (err) {
        console.error(
          `[Webhook Dispatcher] Error delivering webhook ${webhook.id}:`,
          err instanceof Error ? err.message : 'Unknown error'
        );
      }
    });

    // Fire-and-forget: don't block on delivery completion
    Promise.allSettled(deliveryPromises).catch(() => {
      // Swallow — we already log individual errors above
    });
  } catch (err) {
    console.error(
      '[Webhook Dispatcher] Unexpected error:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}
