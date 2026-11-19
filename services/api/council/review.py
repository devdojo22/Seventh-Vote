"""Review status rules. Every status change goes through change_status(), so who may move a version between
draft, in_review and approved is decided here and nowhere else (views only check that the caller may review at
all).

    draft     -> in_review  editDossiers     submit for review
    in_review -> draft      editDossiers     withdraw: only the user who submitted this version
    in_review -> draft      approveDossiers  send back: a note saying why is required
    in_review -> approved   approveDossiers  approve
    draft     -> approved   approveDossiers  approve directly
    approved  -> anything   never            editing an approved dossier saves a new draft version instead
"""

from django.db import transaction

from core.permissions import has_workspace_permission
from council import errors
from council.models import Dossier, DossierVersion, Member, ReviewStatus, ReviewStatusChange

EDIT = "editDossiers"
APPROVE = "approveDossiers"


def submitter_of(version: DossierVersion) -> str | None:
    """Who submitted this version for review: the latest change that moved it to in_review. None if it never
    was."""
    submitted_by = (
        ReviewStatusChange.objects.filter(version=version, to_status=ReviewStatus.IN_REVIEW)
        .order_by("-changed_at")
        .values_list("changed_by", flat=True)
        .first()
    )
    return None if submitted_by is None else str(submitted_by)


def _not_allowed(message: str) -> errors.Conflict:
    return errors.Conflict(message, code="status_not_allowed")


def _check_transition(principal, version: DossierVersion, to_status: str, note: str) -> None:
    """Raises 409 status_not_allowed unless the caller may move this version to to_status."""
    from_status = version.status
    if from_status == ReviewStatus.APPROVED:
        raise _not_allowed(
            f"Version {version.version_no} is approved, so its status can't change. "
            "Edit the dossier to start a new draft."
        )

    if to_status == ReviewStatus.APPROVED:
        if not has_workspace_permission(principal, APPROVE):
            raise _not_allowed("You don't have permission to approve dossiers.")
        return

    if from_status == ReviewStatus.DRAFT and to_status == ReviewStatus.IN_REVIEW:
        if not has_workspace_permission(principal, EDIT):
            raise _not_allowed("You don't have permission to submit dossiers for review.")
        return

    if from_status == ReviewStatus.IN_REVIEW and to_status == ReviewStatus.DRAFT:
        if submitter_of(version) == principal.user_id and has_workspace_permission(principal, EDIT):
            return  # Withdraw.
        if not has_workspace_permission(principal, APPROVE):
            raise _not_allowed("Only the user who submitted this version can withdraw it.")
        if not note:
            raise _not_allowed("Add a note explaining why this version is being sent back.")
        return

    raise _not_allowed(f"A version can't move from {from_status} to {to_status}.")


@transaction.atomic
def change_status(*, version: DossierVersion, to_status: str, principal, note: str = "") -> ReviewStatusChange:
    """Only the current version can be reviewed: a reviewer who read an older one gets a 409 instead of
    their decision landing on a version they haven't seen. The dossier row is locked first, as
    services.save_dossier does, so a save can't slip in between the check and the change."""
    dossier = Dossier.objects.select_for_update().get(pk=version.dossier_id)
    if dossier.current_version_id != version.pk:
        current_no = DossierVersion.objects.values_list("version_no", flat=True).get(
            pk=dossier.current_version_id
        )
        raise errors.review_outdated(version.version_no, current_no)
    locked = DossierVersion.objects.select_for_update().get(pk=version.pk)
    if Member.objects.filter(dossier__id=locked.dossier_id, archived_at__isnull=False).exists():
        raise errors.dossier_archived()
    if to_status == locked.status:
        raise errors.Conflict(f"Version {locked.version_no} is already {to_status}.", code="status_unchanged")
    note = note.strip()
    _check_transition(principal, locked, to_status, note)

    change = ReviewStatusChange.objects.create(
        version=locked,
        from_status=locked.status,
        to_status=to_status,
        changed_by=principal.user_id,
        note=note,
        self_approved=to_status == ReviewStatus.APPROVED and str(locked.created_by) == principal.user_id,
    )
    locked.status = to_status
    locked.save(update_fields=["status"])

    if to_status == ReviewStatus.APPROVED:
        from ai.embeddings import embed_after_approve 

        embed_after_approve(locked)
    return change