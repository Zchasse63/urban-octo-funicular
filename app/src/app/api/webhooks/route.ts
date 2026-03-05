import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { encryptString } from '@/lib/buzzsprout/encryption';
import { CreateWebhookSchema, parseBody } from '@/lib/validation-schemas';

// ─── Types ──────────────────────────────────────────────────────────────────

interface WebhookRecord {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** The shape returned to API consumers — secret is always masked */
interface WebhookRecordMasked {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  has_secret: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateWebhookBody {
  url: string;
  events: string[];
  secret?: string;
}

const VALID_EVENTS = ['episode.completed', 'episode.failed', 'asset.generated'];

/**
 * Mask webhook records for API responses — never expose the stored
 * (encrypted) secret. Instead, just indicate whether a secret exists.
 */
function maskWebhookRecords(webhooks: WebhookRecord[]): WebhookRecordMasked[] {
  return webhooks.map(({ secret, ...rest }) => ({
    ...rest,
    has_secret: secret !== null && secret !== '',
  }));
}

// ─── GET /api/webhooks ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const supabase = await createClient();

    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
console.error('Error fetching webhooks:', error);
return errorResponse('Internal server error', 500)
    }

    // Mask secrets in the response — never return raw or encrypted secrets
    const masked = maskWebhookRecords((webhooks || []) as WebhookRecord[]);

    return successResponse({ webhooks: masked });
  } catch (error) {
    return handleApiError(error, 'fetching webhooks');
  }
}

// ─── POST /api/webhooks ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const parsed = parseBody(body, CreateWebhookSchema);
    if (parsed.response) return parsed.response;

    // ── Encrypt the webhook secret before storing ──
    // Secrets are stored as encrypted JSON payloads using AES-256-GCM,
    // the same encryption used for Buzzsprout API keys.
    let storedSecret: string | null = null;
    if (parsed.data.secret) {
      const encrypted = encryptString(parsed.data.secret);
      storedSecret = JSON.stringify(encrypted);
    }

    const supabase = await createClient();

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: userId,
        url: parsed.data.url,
        events: parsed.data.events,
        secret: storedSecret,
        active: true,
      })
      .select()
      .single();

    if (error) {
console.error('Error creating webhook:', error);
return errorResponse('Internal server error', 500)
    }

    // Return masked response — never expose the stored secret
    const masked = maskWebhookRecords([webhook as WebhookRecord])[0];

    return successResponse(masked, 201);
  } catch (error) {
    return handleApiError(error, 'creating webhook');
  }
}
