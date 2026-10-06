import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { z } from 'zod';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { audit } from '../lib/audit.js';
import { decrypt, encrypt, randomToken, sha256 } from '../lib/crypto.js';
import { HttpError } from '../lib/errors.js';
import { signAccessToken, signMfaToken } from '../lib/tokens.js';
import { requireAccess, requireMfaToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const REFRESH_COOKIE = 'sv_refresh';
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 12);

const email = z.string().email().transform((s) => s.toLowerCase());
const registerBody = z.object({ email, password: z.string().min(12).max(200) });
const loginBody = z.object({ email, password: z.string().min(1).max(200) });
const codeBody = z.object({ code: z.string().regex(/^\d{6}$/) });
const switchBody = z.object({ workspaceId: z.string().uuid() });

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });

async function issueSession(res, userId, membership) {
  const refresh = randomToken();
  const maxAge = config.refreshTtlDays * 24 * 60 * 60 * 1000;
  await prisma.refreshToken.create({
    data: {
      userId,
      workspaceId: membership?.workspaceId ?? null,
      tokenHash: sha256(refresh),
      expiresAt: new Date(Date.now() + maxAge),
    },
  });
  res.cookie(REFRESH_COOKIE, refresh, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/auth',
    maxAge,
  });
  return {
    accessToken: signAccessToken({ userId, workspaceId: membership?.workspaceId, role: membership?.role }),
    workspaceId: membership?.workspaceId ?? null,
    role: membership?.role ?? null,
  };
}

async function revokeCookieToken(req) {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (raw) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

router.post('/register', limiter, validate(registerBody), async (req, res) => {
  if (!config.allowSelfRegister) throw new HttpError(403, 'Self-registration is disabled');
  const { email, password } = req.body;
  if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, 'Email already registered');
  const user = await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
  audit(req, 'auth.register', user.id);
  res.status(201).json({ mfaRequired: true, mfaSetupRequired: true, mfaToken: signMfaToken(user.id) });
});

// Step 1: password. Always returns an MFA challenge — no access token yet.
router.post('/login', limiter, validate(loginBody), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    audit(req, 'auth.login_failed', user?.id, { email });
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ mfaRequired: true, mfaSetupRequired: !user.mfaEnabled, mfaToken: signMfaToken(user.id) });
});

// Step 2a (first login only): enrol an authenticator app.
router.post('/mfa/setup', requireMfaToken, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.auth.sub } });
  if (user.mfaEnabled) throw new HttpError(409, 'MFA is already enabled');
  const secret = authenticator.generateSecret();
  await prisma.user.update({ where: { id: user.id }, data: { mfaSecret: encrypt(secret) } });
  const otpauthUrl = authenticator.keyuri(user.email, config.mfaIssuer, secret);
  res.json({ otpauthUrl, qrDataUrl: await QRCode.toDataURL(otpauthUrl) });
});

// Step 2b: TOTP code -> session (access token + refresh cookie).
router.post('/mfa/verify', limiter, requireMfaToken, validate(codeBody), async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth.sub },
    include: { memberships: { orderBy: { createdAt: 'asc' } } },
  });
  if (!user.mfaSecret) throw new HttpError(400, 'MFA setup has not been started');
  if (!authenticator.verify({ token: req.body.code, secret: decrypt(user.mfaSecret) })) {
    audit(req, 'auth.mfa_failed', user.id);
    throw new HttpError(401, 'Invalid code');
  }
  if (!user.mfaEnabled) {
    await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });
    audit(req, 'auth.mfa_enrolled', user.id);
  }
  audit(req, 'auth.login', user.id);
  res.json(await issueSession(res, user.id, user.memberships[0]));
});

// Rotates the refresh token. A revoked token being replayed revokes every session for that user.
router.post('/refresh', async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) throw new HttpError(401, 'No session');
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(raw) } });
  if (!stored || stored.expiresAt < new Date()) throw new HttpError(401, 'Session expired');
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    audit(req, 'auth.refresh_reuse', stored.userId);
    throw new HttpError(401, 'Session revoked');
  }
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const membership = stored.workspaceId
    ? await prisma.membership.findUnique({
        where: { userId_workspaceId: { userId: stored.userId, workspaceId: stored.workspaceId } },
      })
    : null;
  res.json(await issueSession(res, stored.userId, membership));
});

router.post('/logout', async (req, res) => {
  await revokeCookieToken(req);
  res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
  res.status(204).end();
});

router.get('/me', requireAccess, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth.sub },
    include: { memberships: { include: { workspace: true } } },
  });
  res.json({
    id: user.id,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    activeWorkspaceId: req.auth.wid,
    role: req.auth.role,
    workspaces: user.memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role })),
  });
});

// Re-issues the session scoped to another workspace the user belongs to.
router.post('/session/workspace', requireAccess, validate(switchBody), async (req, res) => {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: req.auth.sub, workspaceId: req.body.workspaceId } },
  });
  if (!membership) throw new HttpError(403, 'Not a member of that workspace');
  await revokeCookieToken(req);
  res.json(await issueSession(res, req.auth.sub, membership));
});

export default router;
