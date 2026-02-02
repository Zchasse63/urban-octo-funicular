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
