import type { CookieOptions, Request, Response } from 'express';

/** Name and path are part of the public contract with the browser; do not change them. */
export const REFRESH_COOKIE_NAME = 'sv_refresh';
const REFRESH_COOKIE_PATH = '/auth';

function baseOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: 'strict', path: REFRESH_COOKIE_PATH };
}

export function readRefreshCookie(req: Request): string | undefined {
  // cookie-parser types req.cookies as `any`; narrow it before use.
  const cookies: unknown = req.cookies;
  if (typeof cookies !== 'object' || cookies === null || !(REFRESH_COOKIE_NAME in cookies)) return undefined;
  const value: unknown = cookies[REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function setRefreshCookie(res: Response, token: string, maxAgeMs: number, secure: boolean): void {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...baseOptions(secure), maxAge: maxAgeMs });
}

export function clearRefreshCookie(res: Response, secure: boolean): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseOptions(secure));
}
