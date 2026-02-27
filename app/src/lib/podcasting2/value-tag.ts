/**
 * Podcasting 2.0 Value-for-Value (V4V) Tag Generator
 *
 * The <podcast:value> tag enables streaming payments from listeners to
 * podcast creators. It specifies payment method, recipients, and split
 * percentages.
 *
 * Spec: https://github.com/Podcastindex-org/podcast-namespace/blob/main/value/value.md
 *
 * NOTE: This is a scaffold. Actual V4V integration requires:
 * 1. A Lightning Network node or service (e.g., Alby, Fountain, Podverse)
 * 2. Wallet address verification and validation
 * 3. Split percentage configuration UI
 * 4. Real-time payment monitoring (optional)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ValueTag {
  /** Payment network type */
  type: 'lightning' | 'webmonetization';
  /** Payment method identifier (e.g., "keysend" for Lightning) */
  method: string;
  /** Suggested payment amount (e.g., "0.00000005000" sats per second) */
  suggested?: string;
  /** Payment recipients with split percentages */
  recipients: ValueRecipient[];
}

export interface ValueRecipient {
  /** Display name of the recipient */
  name: string;
  /** Recipient type (currently only "wallet" is standard) */
  type: 'wallet';
  /** Payment address (Lightning node pubkey or web monetization pointer) */
  address: string;
  /** Split percentage (0-100, all recipients must sum to 100) */
  split: number;
  /** Whether this recipient collects a service fee */
  fee?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * Common V4V payment methods
 */
export const VALUE_METHODS = {
  /** Lightning Network keysend payments */
  LIGHTNING_KEYSEND: 'keysend',
  /** Web Monetization via Interledger */
  WEB_MONETIZATION: 'ILP',
} as const;

/**
 * Default suggested payment rate (50 sats per minute, standard in podcasting)
 */
export const DEFAULT_SUGGESTED_RATE = '0.00000005000';

// ─── Generator ──────────────────────────────────────────────────────────────

/**
 * Generate a <podcast:value> XML tag from a V4V configuration.
 *
 * @param config - The value tag configuration
 * @returns XML string for the <podcast:value> tag
 *
 * @example
 * ```ts
 * const xml = generateValueTag({
 *   type: 'lightning',
 *   method: 'keysend',
 *   suggested: '0.00000005000',
 *   recipients: [
 *     { name: 'Host', type: 'wallet', address: '03...abc', split: 90 },
 *     { name: 'App', type: 'wallet', address: '02...xyz', split: 10, fee: true },
 *   ],
 * });
 * ```
 */
export function generateValueTag(config: ValueTag): string {
  const recipientXml = config.recipients
    .map((r) => {
      const attrs = [
        `name="${escapeXml(r.name)}"`,
        `type="${r.type}"`,
        `address="${escapeXml(r.address)}"`,
        `split="${r.split}"`,
      ];
      if (r.fee) attrs.push('fee="true"');
      return `    <podcast:valueRecipient ${attrs.join(' ')} />`;
    })
    .join('\n');

  const attrs = [`type="${config.type}"`, `method="${config.method}"`];
  if (config.suggested) attrs.push(`suggested="${config.suggested}"`);

  return `<podcast:value ${attrs.join(' ')}>\n${recipientXml}\n</podcast:value>`;
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validate that recipient splits sum to 100.
 */
export function validateValueTag(config: ValueTag): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.recipients.length === 0) {
    errors.push('At least one recipient is required');
  }

  const totalSplit = config.recipients.reduce((sum, r) => sum + r.split, 0);
  if (totalSplit !== 100) {
    errors.push(`Recipient splits must sum to 100 (currently ${totalSplit})`);
  }

  for (const r of config.recipients) {
    if (r.split < 0 || r.split > 100) {
      errors.push(`Recipient "${r.name}" has invalid split: ${r.split}`);
    }
    if (!r.address || r.address.trim().length === 0) {
      errors.push(`Recipient "${r.name}" is missing a wallet address`);
    }
  }

  if (config.type === 'lightning' && config.method !== 'keysend') {
    errors.push('Lightning type currently only supports "keysend" method');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
