import { createHash, randomBytes } from 'node:crypto';

/** 384 bits of entropy, URL-safe. Used for opaque refresh tokens. */
export function randomToken(): string {
  return randomBytes(48).toString('base64url');
}

/** Opaque tokens are stored only as their SHA-256 digest. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
