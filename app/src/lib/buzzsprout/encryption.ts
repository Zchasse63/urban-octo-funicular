import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// SINGLE SOURCE OF TRUTH for encryption secret validation
// This function is called by both runtime code AND startup validation
export function validateEncryptionSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error('ENCRYPTION_SECRET must be at least 32 characters long');
  }

  // Validate entropy - require at least 16 unique characters to prevent weak secrets
  const uniqueChars = new Set(secret.split('')).size;
  const MIN_UNIQUE_CHARS = 16;

  if (uniqueChars < MIN_UNIQUE_CHARS) {
    throw new Error(
      `ENCRYPTION_SECRET has insufficient entropy: must contain at least ${MIN_UNIQUE_CHARS} unique characters (current: ${uniqueChars})`
    );
  }
}

function getEncryptionKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }

  validateEncryptionSecret(secret);

  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256');
}

export function encryptCredentials(credentials: object): object {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getEncryptionKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(credentials);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    version: 1,
    encrypted: encrypted,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptCredentials(encryptedData: { version?: number; encrypted: string; salt: string; iv: string; tag: string }): object {
  const version = encryptedData.version ?? 1;

  if (version !== 1) {
    throw new Error(`Unsupported encryption version: ${version}. This application only supports version 1.`);
  }

  // Version 1 uses aes-256-gcm
  // Future versions: add version-specific algorithm mapping here
  // Example: if (version === 2) algorithm = 'aes-256-ccm';
  const salt = Buffer.from(encryptedData.salt, 'base64');
  const key = getEncryptionKey(salt);
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const tag = Buffer.from(encryptedData.tag, 'base64');
  const ciphertext = Buffer.from(encryptedData.encrypted, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return JSON.parse(decrypted.toString('utf8'));
}
