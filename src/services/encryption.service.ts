import CryptoJS from 'crypto-js';
import { getConfig } from '../core/config.js';

export class EncryptionService {
  private getSecretKey(): string {
    const config = getConfig();
    const secretKey = config.encryption.secretKey;

    if (secretKey.length < 32) {
      throw new Error('ENCRYPTION_SECRET must be at least 32 characters');
    }

    return secretKey;
  }

  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.getSecretKey()).toString();
  }

  decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.getSecretKey());
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
