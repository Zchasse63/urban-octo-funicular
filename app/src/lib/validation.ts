/**
 * Validation utilities
 */

/**
 * Validate UUID format for path parameters.
 * Uses a permissive pattern (any hex in version/variant positions)
 * because Supabase-generated UUIDs don't always match strict RFC 4122.
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/** @deprecated Use isValidUUID instead */
export const validateUUID = isValidUUID;

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string for database
 */
export function sanitizeString(str: string): string {
  return str.trim().slice(0, 10000); // Max 10k chars
}

/**
 * Validate pagination params
 */
export function validatePagination(
  page?: number,
  limit?: number
): { page: number; limit: number; offset: number } {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(100, Math.max(1, limit || 20));
  const offset = (validPage - 1) * validLimit;

  return { page: validPage, limit: validLimit, offset };
}
