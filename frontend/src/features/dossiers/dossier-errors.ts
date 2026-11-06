import { describeAccessError } from '@/features/access/access-errors';
import { ApiError } from '@/lib/api/http';

export interface ValidationIssue {
  path: string[];
  message: string;
}

/** Every message in Django REST framework's nested validation details, with where it applies. List
 * items are reported by index, as an array or as "0", "1"… keys. */
function validationIssues(details: unknown, path: string[] = []): ValidationIssue[] {
  if (typeof details === 'string') return [{ path, message: details }];
  if (Array.isArray(details)) {
    // A list of messages for one field, or a list of per-item error objects.
    return details.flatMap((item, index) =>
      validationIssues(item, typeof item === 'string' ? path : [...path, String(index)]),
    );
  }
  if (typeof details === 'object' && details !== null) {
    return Object.entries(details).flatMap(([key, value]) =>
      validationIssues(value, key === 'non_field_errors' ? path : [...path, key]),
    );
  }
  return [];
}

/** The fields a save was refused for, in the order the API reports them. */
export function serverValidationIssues(error: unknown): ValidationIssue[] {
  return error instanceof ApiError && error.status === 400 ? validationIssues(error.details) : [];
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
        serverValidationIssues(error)[0]?.message ??
        'Some details weren’t accepted. Review the form.'
      );
    }
    if (error.status === 404) {
      return 'This dossier doesn’t exist in this workspace.';
    }
  }
  return describeAccessError(error);
}
