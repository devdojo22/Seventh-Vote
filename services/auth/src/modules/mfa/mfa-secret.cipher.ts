import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

/**
 * AES-256-GCM encryption for TOTP secrets at rest.
 * Stored format (unchanged from the JS service): base64(iv).base64(tag).base64(ciphertext).
 */
export class MfaSecretCipher {
  private readonly key: Buffer;

  constructor(encryptionKey: string) {
    this.key = createHash('sha256').update(encryptionKey).digest();
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_BYTES });
    const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.');
  }

  /** Throws if the payload is malformed or was encrypted with another key or tampered with. */
  decrypt(payload: string): string {
    const parts = payload.split('.');
    if (parts.length !== 3) throw new Error('Malformed MFA secret ciphertext');
    const [iv, tag, data] = parts.map((part) => Buffer.from(part, 'base64'));
    if (iv?.length !== IV_BYTES || tag?.length !== AUTH_TAG_BYTES || data === undefined) {
      throw new Error('Malformed MFA secret ciphertext');
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_BYTES });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
