import { describeAccessError } from '@/features/access/access-errors';
import { ApiError } from '@/lib/api/http';

/** List items are numbered from 1; DRF reports them by index, as an array or as "0", "1"… keys. */
function fieldLabel(path: (string | number)[]): string {
  return path
    .map((part) => (/^\d+$/.test(String(part)) ? `#${String(Number(part) + 1)}` : part))
    .join(' › ');
}

/** The first message in Django REST framework's nested validation details, with where it applies. */
function firstValidationMessage(details: unknown, path: (string | number)[] = []): string | null {
  if (typeof details === 'string') {
    return path.length > 0 ? `${fieldLabel(path)}: ${details}` : details;
  }
  if (Array.isArray(details)) {
    for (const [index, item] of details.entries()) {
      // A list of messages for one field, or a list of per-item error objects.
      const found = firstValidationMessage(
        item,
        typeof item === 'string' ? path : [...path, index],
      );
      if (found) return found;
    }
    return null;
  }
  if (typeof details === 'object' && details !== null) {
    for (const [key, value] of Object.entries(details)) {
      const found = firstValidationMessage(
        value,
        key === 'non_field_errors' ? path : [...path, key],
      );
      if (found) return found;
    }
  }
  return null;
}

export function currentVersionFromConflict(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.code !== 'version_conflict') return null;
  const details = error.details;
  if (typeof details !== 'object' || details === null || !('currentVersionNo' in details))
    return null;
  return typeof details.currentVersionNo === 'number' ? details.currentVersionNo : null;
}

/** The dossier exists, but not the version asked for (or the URL's version isn't a version number). */
export class VersionNotFoundError extends Error {
  override readonly name = 'VersionNotFoundError';

  constructor(version: string) {
    super(`This dossier has no version ${version}.`);
  }
}

export function describeDossierError(error: unknown): string {
  if (error instanceof VersionNotFoundError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return (
        firstValidationMessage(error.details) ?? 'Some details weren’t accepted. Review the form.'
      );
    }
    if (error.status === 404) {
      return 'This dossier doesn’t exist in this workspace.';
    }
  }
  return describeAccessError(error);
}
