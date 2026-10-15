import { Role } from '@prisma/client';
import { z } from 'zod';

/**
 * Access-token claims. This is the contract the API service verifies:
 * typ=access, mfa=true, wid (active workspace or null), role (or null), sub = user id.
 */
export const accessTokenClaimsSchema = z.object({
  typ: z.literal('access'),
  sub: z.string().uuid(),
  mfa: z.literal(true),
  wid: z.string().uuid().nullable(),
  role: z.nativeEnum(Role).nullable(),
});

/** Short-lived proof that the password step passed; accepted only by /mfa/* routes. */
export const mfaTokenClaimsSchema = z.object({
  typ: z.literal('mfa'),
  sub: z.string().uuid(),
});

export type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;
export type MfaTokenClaims = z.infer<typeof mfaTokenClaimsSchema>;
export type VerifiedTokenClaims = AccessTokenClaims | MfaTokenClaims;
export type TokenType = VerifiedTokenClaims['typ'];

export interface AccessTokenInput {
  userId: string;
  workspaceId: string | null;
  role: Role | null;
}
