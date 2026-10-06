function required(name, minLength = 1) {
  const value = process.env[name];
  if (!value || value.length < minLength) throw new Error(`${name} must be set (min ${minLength} chars)`);
  return value;
}

export const config = {
  port: Number(process.env.AUTH_PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 32),
  jwtIssuer: process.env.JWT_ISSUER ?? 'seventh-vote-auth',
  jwtAudience: process.env.JWT_AUDIENCE ?? 'seventh-vote',
  accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7),
  mfaEncryptionKey: required('MFA_ENCRYPTION_KEY', 32),
  mfaIssuer: process.env.MFA_ISSUER ?? 'Seventh Vote',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  allowSelfRegister: process.env.ALLOW_SELF_REGISTER === 'true',
};
