# M4/01: new file. The simulation version rule.

"""Which dossier version the simulator reads for each member. This is the one place that decides it, so the
council session, the prep brief and the M4 AI agents always read the same version of a member.

    the member has an approved version   -> the latest approved version            basis "approved"
    no version has been approved yet     -> the current version, flagged           basis "unreviewed"

A new draft saved on top of an approved version changes nothing until that draft is approved, so editing a
dossier never takes its member out of the simulation or puts unreviewed claims in front of the AI. The
fallback keeps members whose dossiers haven't been reviewed yet in the council (a vote count missing them would
be wrong), labelled so the user knows how far to trust them.
"""

from dataclasses import dataclass

from django.db import models
from django.db.models import OuterRef, Subquery

from council.models import Dossier, DossierVersion, ReviewStatus


class Basis(models.TextChoices):
    APPROVED = "approved", "Approved"
    UNREVIEWED = "unreviewed", "Unreviewed draft"


@dataclass(frozen=True)
class SimulationVersion:
    dossier: Dossier
    version: DossierVersion
    basis: Basis


def _latest_approved(dossier_ref) -> models.QuerySet:
    return DossierVersion.objects.filter(dossier=dossier_ref, status=ReviewStatus.APPROVED).order_by("-version_no")


def _basis(version: DossierVersion) -> Basis:
    return Basis.APPROVED if version.status == ReviewStatus.APPROVED else Basis.UNREVIEWED


def simulation_version(dossier: Dossier) -> SimulationVersion:
    """The version of one member's dossier that the simulator reads."""
    version = _latest_approved(dossier).first() or dossier.current_version
    return SimulationVersion(dossier=dossier, version=version, basis=_basis(version))


def council_versions(workspace_id: str) -> list[SimulationVersion]:
    """simulation_version() for every active (not archived) member of the workspace, ordered by name, in a
    fixed number of queries however many members there are."""
    dossiers = list(
        Dossier.objects.filter(workspace_id=workspace_id, member__archived_at__isnull=True)
        .select_related("member")
        .annotate(approved_version_id=Subquery(_latest_approved(OuterRef("pk")).values("pk")[:1]))
        .order_by("member__name")
    )
    chosen = {d.pk: d.approved_version_id or d.current_version_id for d in dossiers}
    versions = DossierVersion.objects.filter(pk__in=chosen.values()).prefetch_related("key_records", "quotes")
    by_id = {v.pk: v for v in versions}
    return [
        SimulationVersion(dossier=d, version=by_id[chosen[d.pk]], basis=_basis(by_id[chosen[d.pk]]))
        for d in dossiers
    ]
