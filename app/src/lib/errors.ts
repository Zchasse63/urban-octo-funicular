export class TranscriptionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export class ShowNotesGenerationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ShowNotesGenerationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Extract a human-readable message from an unknown catch value.
 * Works on both client and server — no framework imports.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}
