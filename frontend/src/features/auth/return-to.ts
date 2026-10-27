const AUTH_PATHS = ['/login', '/verify', '/forgot-password', '/reset-password'];

export interface InvitationAcceptedState {
  invitationAccepted: true;
}

export function isInvitationAcceptedState(state: unknown): state is InvitationAcceptedState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'invitationAccepted' in state &&
    state.invitationAccepted === true
  );
}

export interface PasswordResetState {
  passwordReset: true;
}

export function isPasswordResetState(state: unknown): state is PasswordResetState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'passwordReset' in state &&
    state.passwordReset === true
  );
}

export interface ReturnToState {
  from: string;
}

export function readReturnTo(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return '/';
  const { from } = state;
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return '/';
  if (from.includes('\\')) return '/';
  const pathname = from.split(/[?#]/, 1)[0] ?? '/';
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return '/';
  return from;
}
