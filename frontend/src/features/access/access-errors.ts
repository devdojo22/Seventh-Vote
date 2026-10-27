import { ApiError, NetworkError } from '@/lib/api/http';

export function describeAccessError(error: unknown): string {
  if (error instanceof NetworkError)
    return 'Can’t reach Seventh Vote. Check your connection and try again.';
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again in a moment.';
  switch (error.status) {
    case 400: {
      const fieldMessage = Object.values(error.fieldErrors)[0]?.[0];
      return fieldMessage ?? 'Some details weren’t accepted. Review the form.';
    }
    case 401:
      return 'Your session ended. Sign in again to continue.';
    case 403:
      return 'You don’t have permission to do this in this workspace.';
    case 404:
    case 409:
    case 502:
      return error.message;
    case 429:
      return 'Too many requests. Please wait a few minutes before trying again.';
    default:
      return 'Something went wrong. Please try again in a moment.';
  }
}
