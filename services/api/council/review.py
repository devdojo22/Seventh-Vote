"""Review status rules. Every status change goes through change_status(), so later rules ("only approved
versions are used by AI", "only the Principal can approve") are added here and nowhere else."""

from django.db import transaction

from council import errors
from council.models import Dossier, DossierVersion, Member, ReviewStatus, ReviewStatusChange

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    status: set(ReviewStatus.values) - {status} for status in ReviewStatus.values
}


def can_change_status(principal, version: DossierVersion, to_status: str) -> bool:
    """Who may make this change, beyond the view's editDossiers check. Today: anyone with editDossiers."""
    return True


@transaction.atomic
def change_status(*, version: DossierVersion, to_status: str, principal) -> ReviewStatusChange:
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
    if to_status not in ALLOWED_TRANSITIONS[locked.status]:
        raise errors.Conflict(f"Version {locked.version_no} is already {to_status}.", code="status_unchanged")
    if not can_change_status(principal, locked, to_status):
        raise errors.Conflict("You can't make this status change.", code="status_not_allowed")

    change = ReviewStatusChange.objects.create(
        version=locked, from_status=locked.status, to_status=to_status, changed_by=principal.user_id
    )
    locked.status = to_status
    locked.save(update_fields=["status"])
    return change
