import { ApiError, NetworkError } from '@/lib/api/http';
import type { AuthNoticeContent } from './AuthControls';

const INVITATION_FIELDS = ['firstName', 'lastName', 'password', 'confirmPassword'] as const;
export type InvitationField = (typeof INVITATION_FIELDS)[number];

const NETWORK_NOTICE: AuthNoticeContent = {
  title: 'Can’t reach Seventh Vote',
  body: 'Check your connection and try again.',
};

const RATE_LIMIT_NOTICE: AuthNoticeContent = {
  title: 'Too many attempts',
  body: 'Please wait a few minutes before trying again.',
};

const SERVER_NOTICE: AuthNoticeContent = {
  title: 'Something went wrong',
  body: 'We couldn’t complete your request. Please try again in a moment.',
};

const UNAVAILABLE_NOTICE: AuthNoticeContent = {
  title: 'We couldn’t send your code',
  body: 'The verification email couldn’t be sent right now. Please try again in a moment.',
};

export const INVITATION_INVALID_NOTICE: AuthNoticeContent = {
  title: 'This invitation can’t be used',
  body: 'It expired, was already used, or was withdrawn. Ask the person who invited you for a new invitation.',
};

export interface InvitationErrorView {
  kind: 'invalid-link' | 'account-exists' | 'wrong-account' | 'form' | 'retryable';
  fieldErrors: Partial<Record<InvitationField, string>>;
  notice: AuthNoticeContent | null;
}

export function describeInvitationError(error: unknown): InvitationErrorView {
  const view = (
    kind: InvitationErrorView['kind'],
    notice: AuthNoticeContent | null,
    fieldErrors: InvitationErrorView['fieldErrors'] = {},
  ): InvitationErrorView => ({ kind, fieldErrors, notice });

  if (error instanceof NetworkError) return view('retryable', NETWORK_NOTICE);
  if (!(error instanceof ApiError)) return view('retryable', SERVER_NOTICE);

  switch (error.status) {
    case 400: {
      if (error.code !== 'validation_failed' || error.fieldErrors.token) {
        return view('invalid-link', INVITATION_INVALID_NOTICE);
      }
      const fieldErrors: Partial<Record<InvitationField, string>> = {};
      for (const field of INVITATION_FIELDS) {
        const message = error.fieldErrors[field]?.[0];
        if (message) fieldErrors[field] = message;
      }
      return view(
        'form',
        Object.keys(fieldErrors).length > 0
          ? null
          : {
              title: 'Check your details',
              body: 'Some details weren’t accepted. Review the form.',
            },
        fieldErrors,
      );
    }
    case 403:
      return view('wrong-account', {
        title: 'Signed in with a different account',
        body: 'This invitation was sent to another email address. Sign out, then sign in with the invited address.',
      });
    case 409:
      if (error.code === 'account_exists') {
        return view('account-exists', {
          title: 'You already have an account',
          body: 'Sign in with the invited email address to accept the invitation.',
        });
      }
      return view('retryable', SERVER_NOTICE);
    case 429:
      return view('retryable', RATE_LIMIT_NOTICE);
    default:
      return view('retryable', SERVER_NOTICE);
  }
}

export function describeLoginError(error: unknown): AuthNoticeContent {
  if (error instanceof NetworkError) return NETWORK_NOTICE;
  if (!(error instanceof ApiError)) return SERVER_NOTICE;

  if (error.status === 401) {
    return { title: 'Sign-in failed', body: 'Invalid email address or password.' };
  }
  if (error.status === 429) return RATE_LIMIT_NOTICE;
  if (error.status === 503) return UNAVAILABLE_NOTICE;
  return SERVER_NOTICE;
}

export const INVALID_CODE_MESSAGE =
  'That code didn’t match. Check the 8-digit code in your latest email.';


export type CodeErrorKind =
  'invalid-code' | 'code-expired' | 'locked' | 'session-expired' | 'retryable';

export interface CodeErrorView {
  kind: CodeErrorKind;
  notice: AuthNoticeContent;
}

const CODE_EXPIRED_NOTICE: AuthNoticeContent = {
  title: 'This code can’t be used anymore',
  body: 'It expired, was already used, or was replaced by a newer code. Request a new code below.',
};

const LOCKED_NOTICE: AuthNoticeContent = {
  title: 'Too many incorrect codes',
  body: 'For your security this code is now blocked. Request a new code below.',
};

const SESSION_EXPIRED_NOTICE: AuthNoticeContent = {
  title: 'Your verification timed out',
  body: 'For your security, this step lasts 30 minutes. Sign in again with your email and password to get a new code.',
};

export function describeCodeError(error: unknown): CodeErrorView {
  if (error instanceof NetworkError) return { kind: 'retryable', notice: NETWORK_NOTICE };
  if (!(error instanceof ApiError)) return { kind: 'retryable', notice: SERVER_NOTICE };

  if (error.status === 400 || error.code === 'invalid_code') {
    return {
      kind: 'invalid-code',
      notice: { title: 'Code not accepted', body: INVALID_CODE_MESSAGE },
    };
  }
  if (error.status === 401) return { kind: 'session-expired', notice: SESSION_EXPIRED_NOTICE };
  if (error.status === 410) return { kind: 'code-expired', notice: CODE_EXPIRED_NOTICE };
  if (error.code === 'too_many_attempts') return { kind: 'locked', notice: LOCKED_NOTICE };
  if (error.status === 429) return { kind: 'retryable', notice: RATE_LIMIT_NOTICE };
  return { kind: 'retryable', notice: SERVER_NOTICE };
}


export type ResendErrorKind = 'cooldown' | 'session-expired' | 'retryable';

export interface ResendErrorView {
  kind: ResendErrorKind;
  notice: AuthNoticeContent;
  retryAfterSeconds?: number;
}

function retryAfterSeconds(details: unknown): number | undefined {
  if (typeof details !== 'object' || details === null || !('retryAfterSeconds' in details)) {
    return undefined;
  }
  const value = details.retryAfterSeconds;
  return typeof value === 'number' && value > 0 ? value : undefined;
}

export function describeResendError(error: unknown): ResendErrorView {
  if (error instanceof NetworkError) return { kind: 'retryable', notice: NETWORK_NOTICE };
  if (!(error instanceof ApiError)) return { kind: 'retryable', notice: SERVER_NOTICE };

  if (error.status === 401) return { kind: 'session-expired', notice: SESSION_EXPIRED_NOTICE };
  if (error.code === 'resend_cooldown') {
    return {
      kind: 'cooldown',
      notice: { title: 'Please wait a moment', body: 'You can request another code shortly.' },
      retryAfterSeconds: retryAfterSeconds(error.details),
    };
  }
  if (error.status === 429) {
    return {
      kind: 'retryable',
      notice: {
        title: 'Too many codes requested',
        body: 'Use the most recent code you received, or try again in 30 minutes.',
      },
    };
  }
  if (error.status === 503) return { kind: 'retryable', notice: UNAVAILABLE_NOTICE };
  return { kind: 'retryable', notice: SERVER_NOTICE };
}

export function describeResetRequestError(error: unknown): AuthNoticeContent {
  if (error instanceof NetworkError) return NETWORK_NOTICE;
  if (error instanceof ApiError && error.status === 429) return RATE_LIMIT_NOTICE;
  return SERVER_NOTICE;
}

export const RESET_LINK_INVALID_NOTICE: AuthNoticeContent = {
  title: 'This reset link can’t be used',
  body: 'Reset links work once and only for 15 minutes. Request a new link to continue.',
};

export interface ResetPasswordErrorView {
  kind: 'invalid-link' | 'invalid-password' | 'retryable';
  notice: AuthNoticeContent;
  passwordError?: string;
}

export function describeResetPasswordError(error: unknown): ResetPasswordErrorView {
  if (error instanceof NetworkError) return { kind: 'retryable', notice: NETWORK_NOTICE };
  if (!(error instanceof ApiError)) return { kind: 'retryable', notice: SERVER_NOTICE };
  if (error.status === 429) return { kind: 'retryable', notice: RATE_LIMIT_NOTICE };
  if (error.code === 'validation_failed') {
    if (error.fieldErrors.token) return { kind: 'invalid-link', notice: RESET_LINK_INVALID_NOTICE };
    return {
      kind: 'invalid-password',
      notice: { title: 'Check your new password', body: 'It wasn’t accepted. Review the form.' },
      passwordError: error.fieldErrors.password?.[0] ?? error.fieldErrors.confirmPassword?.[0],
    };
  }
  if (error.status === 400) return { kind: 'invalid-link', notice: RESET_LINK_INVALID_NOTICE };
  return { kind: 'retryable', notice: SERVER_NOTICE };
}

const CHANGE_PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const;
export type ChangePasswordField = (typeof CHANGE_PASSWORD_FIELDS)[number];

export interface ChangePasswordErrorView {
  fieldErrors: Partial<Record<ChangePasswordField, string>>;
  notice: AuthNoticeContent | null;
}

export function describeChangePasswordError(error: unknown): ChangePasswordErrorView {
  if (error instanceof NetworkError) return { fieldErrors: {}, notice: NETWORK_NOTICE };
  if (!(error instanceof ApiError)) return { fieldErrors: {}, notice: SERVER_NOTICE };

  switch (error.status) {
    case 400: {
      const fieldErrors: Partial<Record<ChangePasswordField, string>> = {};
      for (const field of CHANGE_PASSWORD_FIELDS) {
        const message = error.fieldErrors[field]?.[0];
        if (message) fieldErrors[field] = message;
      }
      return {
        fieldErrors,
        notice:
          Object.keys(fieldErrors).length > 0
            ? null
            : {
                title: 'Check your details',
                body: 'Some details weren’t accepted. Review the form.',
              },
      };
    }
    case 401:
      return {
        fieldErrors: {},
        notice: { title: 'Your session ended', body: 'Sign in again, then change your password.' },
      };
    case 409:
      return {
        fieldErrors: {},
        notice: {
          title: 'Your password was just changed elsewhere',
          body: 'Sign in again with your newest password before changing it.',
        },
      };
    case 429:
      return { fieldErrors: {}, notice: RATE_LIMIT_NOTICE };
    default:
      return { fieldErrors: {}, notice: SERVER_NOTICE };
  }
}
