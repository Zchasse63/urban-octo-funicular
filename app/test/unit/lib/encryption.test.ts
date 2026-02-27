/**
 * Tests for lib/buzzsprout/encryption.ts
 *
 * DANGER-3: AES-256-GCM encryption of stored API keys. A bug in
 * encrypt/decrypt silently corrupts credentials. Users can't connect
 * their hosting platforms and don't know why.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set encryption secret before importing module
const TEST_SECRET = 'a-very-secure-test-encryption-secret-with-high-entropy-1234567890!@#$%^&*()';

describe('Buzzsprout Encryption', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_SECRET;
  });

  describe('validateEncryptionSecret', () => {
    it('accepts valid secret with sufficient length and entropy', async () => {
      const { validateEncryptionSecret } = await import('@/lib/buzzsprout/encryption');
      expect(() => validateEncryptionSecret(TEST_SECRET)).not.toThrow();
    });

    it('rejects secret shorter than 32 characters', async () => {
      const { validateEncryptionSecret } = await import('@/lib/buzzsprout/encryption');
      expect(() => validateEncryptionSecret('short')).toThrow(
        /at least 32 characters/
      );
    });

    it('rejects secret with low entropy (repeated chars)', async () => {
      const { validateEncryptionSecret } = await import('@/lib/buzzsprout/encryption');
      // 32+ chars but only 1 unique character
      expect(() => validateEncryptionSecret('a'.repeat(40))).toThrow(
        /insufficient entropy/
      );
    });

    it('rejects secret with borderline entropy', async () => {
      const { validateEncryptionSecret } = await import('@/lib/buzzsprout/encryption');
      // 32+ chars but only 10 unique characters (below 16 threshold)
      const lowEntropy = 'abcdefghij'.repeat(4); // 10 unique, 40 chars
      expect(() => validateEncryptionSecret(lowEntropy)).toThrow(
        /insufficient entropy/
      );
    });

    it('accepts secret with exactly 16 unique characters', async () => {
      const { validateEncryptionSecret } = await import('@/lib/buzzsprout/encryption');
      // Exactly 16 unique chars, 32+ length
      const validSecret = 'abcdefghijklmnop'.repeat(2); // 16 unique, 32 chars
      expect(() => validateEncryptionSecret(validSecret)).not.toThrow();
    });
  });

  describe('encryptCredentials', () => {
    it('returns object with expected fields', async () => {
      const { encryptCredentials } = await import('@/lib/buzzsprout/encryption');
      const creds = { apiKey: 'bz_test_123', domain: 'test.buzzsprout.com' };

      const encrypted = encryptCredentials(creds) as Record<string, unknown>;

      expect(encrypted).toHaveProperty('version', 1);
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
    });

    it('produces different ciphertext for same input (random IV + salt)', async () => {
      const { encryptCredentials } = await import('@/lib/buzzsprout/encryption');
      const creds = { apiKey: 'same-key' };

      const e1 = encryptCredentials(creds) as Record<string, string>;
      const e2 = encryptCredentials(creds) as Record<string, string>;

      // Different salt → different key → different ciphertext
      expect(e1.encrypted).not.toBe(e2.encrypted);
      expect(e1.salt).not.toBe(e2.salt);
      expect(e1.iv).not.toBe(e2.iv);
    });

    it('throws when ENCRYPTION_SECRET is not set', async () => {
      delete process.env.ENCRYPTION_SECRET;
      // Need to re-import to get fresh module
      const mod = await import('@/lib/buzzsprout/encryption');

      expect(() => mod.encryptCredentials({ apiKey: 'test' })).toThrow(
        /ENCRYPTION_SECRET/
      );
    });
  });

  describe('decryptCredentials', () => {
    it('round-trips simple credentials', async () => {
      const { encryptCredentials, decryptCredentials } = await import('@/lib/buzzsprout/encryption');
      const original = { apiKey: 'bz_test_key_123', baseUrl: 'https://api.buzzsprout.com' };

      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted as { version?: number; encrypted: string; salt: string; iv: string; tag: string });

      expect(decrypted).toEqual(original);
    });

    it('round-trips complex nested credentials', async () => {
      const { encryptCredentials, decryptCredentials } = await import('@/lib/buzzsprout/encryption');
      const original = {
        apiKey: 'test-key',
        config: {
          endpoint: 'https://example.com',
          settings: { timeout: 5000, retries: 3 },
        },
        tags: ['podcast', 'hosting'],
      };

      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted as { version?: number; encrypted: string; salt: string; iv: string; tag: string });

      expect(decrypted).toEqual(original);
    });

    it('round-trips empty object', async () => {
      const { encryptCredentials, decryptCredentials } = await import('@/lib/buzzsprout/encryption');

      const encrypted = encryptCredentials({});
      const decrypted = decryptCredentials(encrypted as { version?: number; encrypted: string; salt: string; iv: string; tag: string });

      expect(decrypted).toEqual({});
    });

    it('round-trips credentials with special characters', async () => {
      const { encryptCredentials, decryptCredentials } = await import('@/lib/buzzsprout/encryption');
      const original = {
        apiKey: 'key-with-special-chars!@#$%^&*()',
        unicode: '🎙️ Podcast 日本語',
      };

      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted as { version?: number; encrypted: string; salt: string; iv: string; tag: string });

      expect(decrypted).toEqual(original);
    });

    it('rejects unsupported encryption version', async () => {
      const { decryptCredentials } = await import('@/lib/buzzsprout/encryption');

      expect(() => decryptCredentials({
        version: 99,
        encrypted: 'abc',
        salt: 'def',
        iv: 'ghi',
        tag: 'jkl',
      })).toThrow(/Unsupported encryption version/);
    });

    it('fails with tampered ciphertext (GCM auth tag check)', async () => {
      const { encryptCredentials, decryptCredentials } = await import('@/lib/buzzsprout/encryption');

      const encrypted = encryptCredentials({ apiKey: 'secret' }) as {
        version?: number; encrypted: string; salt: string; iv: string; tag: string;
      };

      // Tamper with the encrypted data
      encrypted.encrypted = 'deadbeef' + encrypted.encrypted.slice(8);

      expect(() => decryptCredentials(encrypted)).toThrow();
    });

    it('fails with wrong auth tag', async () => {
      const { encryptCredentials, decryptCredentials } = await import('@/lib/buzzsprout/encryption');

      const encrypted = encryptCredentials({ apiKey: 'secret' }) as {
        version?: number; encrypted: string; salt: string; iv: string; tag: string;
      };

      // Replace auth tag
      encrypted.tag = Buffer.from('0000000000000000').toString('base64');

      expect(() => decryptCredentials(encrypted)).toThrow();
    });
  });
});
