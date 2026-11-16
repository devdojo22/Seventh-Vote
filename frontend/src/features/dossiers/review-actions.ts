import type { ReviewStatus } from '@/types/dossier';
import type { DossierVersion } from './dossier-api';
import type { DossierAccess } from './use-dossier-access';

export type ReviewAction = 'submit' | 'withdraw' | 'approve' | 'sendBack';

/** The status each action moves the version to. */
export const REVIEW_ACTION_TARGETS: Record<ReviewAction, ReviewStatus> = {
  submit: 'in_review',
  withdraw: 'draft',
  approve: 'approved',
  sendBack: 'draft',
};

export const REVIEW_ACTION_LABELS: Record<ReviewAction, string> = {
  submit: 'Submit for review',
  withdraw: 'Withdraw',
  approve: 'Approve',
  sendBack: 'Send back',
};

export const REVIEW_ACTION_DONE: Record<ReviewAction, string> = {
  submit: 'Submitted for review',
  withdraw: 'Withdrawn from review',
  approve: 'Version approved',
  sendBack: 'Sent back to draft',
};

/** Which review actions to offer on the current version. Mirrors the rules in the API's council/review.py,
 * which stays the authority: this only hides what would be refused. */
export function reviewActionsFor(
  version: Pick<DossierVersion, 'status' | 'submittedBy'>,
  access: Pick<DossierAccess, 'canEdit' | 'canApprove'>,
  userId: string,
): ReviewAction[] {
  switch (version.status) {
    case 'draft':
      return [
        ...(access.canEdit ? (['submit'] as const) : []),
        ...(access.canApprove ? (['approve'] as const) : []),
      ];
    case 'in_review': {
      const isSubmitter = access.canEdit && version.submittedBy === userId;
      return [
        ...(access.canApprove ? (['approve'] as const) : []),
        ...(isSubmitter ? (['withdraw'] as const) : []),
        ...(access.canApprove && !isSubmitter ? (['sendBack'] as const) : []),
      ];
    }
    case 'approved':
      return [];
  }
}

/** Why the user who submitted an in-review version can't withdraw it, or null when that doesn't apply. The
 * API only lets the submitter withdraw while they can still edit dossiers (council/review.py); this rule is
 * kept, and explained, for a submitter whose edit grant was removed while the version was in review. */
export function withdrawBlockedReason(
  version: Pick<DossierVersion, 'status' | 'submittedBy'>,
  access: Pick<DossierAccess, 'canEdit' | 'canApprove'>,
  userId: string,
): string | null {
  if (version.status !== 'in_review' || version.submittedBy !== userId || access.canEdit)
    return null;
  return access.canApprove
    ? 'You submitted this version, but you can no longer edit dossiers, so you can’t withdraw it. You can still approve it, or send it back to draft with a note.'
    : 'You submitted this version, but you can no longer edit dossiers, so you can’t withdraw it. Someone who can approve dossiers can approve it or send it back to draft.';
}
