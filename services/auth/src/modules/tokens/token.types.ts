import { OtpPurpose, Role } from '@prisma/client';
import { z } from 'zod';

const securityVersionClaim = z.number().int().nonnegative();


export const accessTokenClaimsSchema = z.object({
  typ: z.literal('access'),
  sub: z.string().uuid(),
  mfa: z.literal(true),
  wid: z.string().uuid().nullable(),
  role: z.nativeEnum(Role).nullable(),
  sv: securityVersionClaim,
});


export const mfaTokenClaimsSchema = z.object({
  typ: z.literal('mfa'),
  sub: z.string().uuid(),
  cid: z.string().uuid(),
  pur: z.literal(OtpPurpose.LOGIN),
  rem: z.boolean().default(false),
  sv: securityVersionClaim,
});

export type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;
export type MfaTokenClaims = z.infer<typeof mfaTokenClaimsSchema>;
export type VerifiedTokenClaims = AccessTokenClaims | MfaTokenClaims;
export type TokenType = VerifiedTokenClaims['typ'];

export interface AccessTokenInput {
  userId: string;
  workspaceId: string | null;
  role: Role | null;
  securityVersion: number;
}

export interface MfaTokenInput {
  userId: string;
  challengeId: string;
  purpose: OtpPurpose;
  rememberDevice: boolean;
  securityVersion: number;
  ttlSeconds: number;
}
