import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptionService } from '../../../src/services/encryption.service';

const mockConfig = {
  encryption: {
    secretKey: 'test-encryption-secret-key-that-is-long-enough',
  },
};

vi.mock('../../../src/core/config', () => ({
  getConfig: () => mockConfig,
}));

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService();
  });

  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const plaintext = 'my-secret-token';

      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for same plaintext (due to IV)', () => {
      const plaintext = 'my-secret-token';

      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      // AES encryption with random IV should produce different ciphertext each time
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty strings', () => {
      const plaintext = '';

      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should handle special characters', () => {
      const plaintext = 'token-with-special-chars-!@#$%^&*()_+={}[]|:;"<>?,./';

      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should handle unicode characters', () => {
      const plaintext = 'token-with-unicode-🚀-emoji-and-中文';

      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000);

      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const plaintext = 'my-secret-token';

      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';

      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'token-with-special-chars-!@#$%^&*()_+={}[]|:;"<>?,./';

      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'token-with-unicode-🚀-emoji-and-中文';

      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000);

      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return empty string when decrypting invalid ciphertext', () => {
      const invalidCiphertext = 'invalid-ciphertext';

      const decrypted = service.decrypt(invalidCiphertext);

      // CryptoJS returns empty string for invalid decryption
      expect(decrypted).toBe('');
    });
  });

  describe('encryption and decryption roundtrip', () => {
    it('should successfully roundtrip multiple values', () => {
      const values = [
        'simple-token',
        'token-with-dashes-123',
        'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
        'very-long-token-' + 'x'.repeat(1000),
      ];

      values.forEach((value) => {
        const encrypted = service.encrypt(value);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(value);
      });
    });
  });

  describe('secret key validation', () => {
    it('should throw error if secret key is too short', () => {
      const shortKeyConfig = {
        encryption: {
          secretKey: 'short',
        },
      };

      vi.mocked(mockConfig).encryption = shortKeyConfig.encryption;

      const service = new EncryptionService();

      expect(() => service.encrypt('test')).toThrow(
        'ENCRYPTION_SECRET must be at least 32 characters'
      );
    });

    it('should accept secret key with exactly 32 characters', () => {
      const exactKeyConfig = {
        encryption: {
          secretKey: '12345678901234567890123456789012', // exactly 32 chars
        },
      };

      vi.mocked(mockConfig).encryption = exactKeyConfig.encryption;

      const service = new EncryptionService();

      expect(() => service.encrypt('test')).not.toThrow();
    });
  });
});
