/**
 * Validation utilities
 */

/**
 * Validate UUID format
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

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
