/**
 * Zod validation schemas for API route request bodies.
 *
 * Each schema defines the accepted shape for a specific mutation endpoint.
 * Schemas are intentionally strict: unknown keys are stripped via `.strict()`
 * or passthrough as needed, and string fields are length-bounded.
 */
import { z } from 'zod';
import { isSafeExternalUrl, SSRF_GUARD_REFINE_MESSAGE } from '@/lib/security/ssrf-guard';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const uuid = z.string().uuid();
const trimmedString = (max: number) => z.string().trim().min(1).max(max);
const optionalTrimmed = (max: number) => z.string().trim().max(max).optional();
const httpUrl = z
  .string()
  .url()
  .refine(
    (val) => {
      try {
        const u = new URL(val);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid http or https URL' }
  )
  .refine(isSafeExternalUrl, { message: SSRF_GUARD_REFINE_MESSAGE });

// ---------------------------------------------------------------------------
// Shows
// ---------------------------------------------------------------------------

export const CreateShowSchema = z.object({
  name: trimmedString(200),
  description: optionalTrimmed(5000),
  default_language: z.string().min(2).max(10).default('en'),
  style_preferences: z.record(z.string(), z.unknown()).optional().default({}),
  artwork_url: z.string().url().max(2000).nullish(),
}).strict();

export const UpdateShowSchema = z.object({
  name: trimmedString(200).optional(),
  description: z.string().trim().max(5000).nullish(),
  default_language: z.string().min(2).max(10).optional(),
  style_preferences: z.record(z.string(), z.unknown()).optional(),
  artwork_url: z.string().url().max(2000).nullish(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

// ---------------------------------------------------------------------------
// Episodes
// ---------------------------------------------------------------------------

export const CreateEpisodeSchema = z.object({
  show_id: uuid,
  title: optionalTrimmed(500),
  description: optionalTrimmed(10000),
  audio_url: z.string().url().max(2000),
  guest_name: optionalTrimmed(200),
  guest_bio: optionalTrimmed(5000),
  language: z.string().min(2).max(10).default('en'),
}).strict();

export const UpdateEpisodeSchema = z.object({
  title: optionalTrimmed(500),
  description: optionalTrimmed(10000),
  show_notes: z.string().max(100000).nullish(),
  show_notes_html: z.string().max(200000).nullish(),
  guest_name: optionalTrimmed(200),
  guest_bio: optionalTrimmed(5000),
  guest_links: z.record(z.string(), z.unknown()).nullish(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

const VALID_WEBHOOK_EVENTS = ['episode.completed', 'episode.failed', 'asset.generated'] as const;

export const CreateWebhookSchema = z.object({
  url: httpUrl,
  events: z.array(z.enum(VALID_WEBHOOK_EVENTS)).min(1).max(10),
  secret: z.string().max(500).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

const teamRole = z.enum(['admin', 'editor', 'viewer']);

export const InviteTeamMemberSchema = z.object({
  email: z.string().email().max(320),
  role: teamRole.default('editor'),
}).strict();

export const UpdateTeamMemberSchema = z.object({
  role: teamRole,
}).strict();

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const CreateVocabularyTermSchema = z.object({
  term: trimmedString(200),
  alternatives: z.array(z.string().trim().max(200)).max(50).default([]),
}).strict();

// ---------------------------------------------------------------------------
// RSS Import
// ---------------------------------------------------------------------------

export const ImportFeedSchema = z.object({
  feedUrl: httpUrl,
}).strict();

// ---------------------------------------------------------------------------
// Stripe Checkout
// ---------------------------------------------------------------------------

const pricingTier = z.enum(['pro', 'creator', 'agency']);
const billingInterval = z.enum(['monthly', 'annual']);

export const CheckoutSchema = z.object({
  tier: pricingTier,
  interval: billingInterval.default('monthly'),
}).strict();

// ---------------------------------------------------------------------------
// Helper: parse body with schema and return 400 on failure
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/database';

/**
 * Parse and validate a request body against a Zod schema.
 * Returns `{ data }` on success or `{ error, response }` on failure
 * so the caller can immediately return the 400 response.
 */
export function parseBody<T extends z.ZodType>(
  body: unknown,
  schema: T
): { data: z.infer<T>; error?: never; response?: never } | { data?: never; error: string; response: NextResponse } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { data: result.data };
  }

  const firstIssue = result.error.issues[0];
  const path = firstIssue?.path?.length ? firstIssue.path.join('.') + ': ' : '';
  const message = `${path}${firstIssue?.message || 'Invalid input'}`;

  return {
    error: message,
    response: NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 400 }
    ),
  };
}
