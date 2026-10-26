import type { CookieOptions, Request, Response } from 'express';
import type { IssuedSession } from './session.service.js';

export const REFRESH_COOKIE_NAME = 'sv_refresh';
const REFRESH_COOKIE_PATH = '/auth';

function baseOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: 'strict', path: REFRESH_COOKIE_PATH };
}

export function readRefreshCookie(req: Request): string | undefined {
  const cookies: unknown = req.cookies;
  if (typeof cookies !== 'object' || cookies === null || !(REFRESH_COOKIE_NAME in cookies)) return undefined;
  const value: unknown = cookies[REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}


export function sendSession(res: Response, session: IssuedSession, secure: boolean): void {
  const lifetime = session.cookieMaxAgeMs === null ? {} : { maxAge: session.cookieMaxAgeMs };
  res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, { ...baseOptions(secure), ...lifetime });
  res.json(session.body);
}

export function clearRefreshCookie(res: Response, secure: boolean): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseOptions(secure));
}
