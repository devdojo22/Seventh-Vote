"""Dossier writes. Views validate input; everything that touches more than one row happens here, in one
transaction."""

from django.db import transaction
from django.utils import timezone

from council import errors
from council.models import Dossier, DossierArchiveEvent, DossierVersion, KeyRecord, Member, VoiceQuote

IDENTITY_FIELDS = ("name", "initials", "district", "leadership_role", "took_office")
_GENERATIONAL_SUFFIXES = {"jr", "jr.", "sr", "sr.", "ii", "iii", "iv"}


def derive_initials(name: str) -> str:
    """Up to three initials from a name, skipping generational suffixes: "Edmund Ford Jr." -> "EF"."""
    words = [w for w in name.split() if w.lower() not in _GENERATIONAL_SUFFIXES]
    return "".join(w[0] for w in words[:3]).upper() or "?"


def _identity(content: dict) -> dict:
    identity = {field: content.get(field, "") for field in IDENTITY_FIELDS}
    identity["initials"] = identity["initials"] or derive_initials(identity["name"])
    return identity


def _follow_rename(content: dict, member: Member) -> dict:
    """Initials generated from the old name follow a rename; initials someone typed are kept. The editor sends
    the stored initials back as they were, so initials still equal to the old name's generated ones were
    generated, and are cleared here to be generated again from the new name (see _identity)."""
    initials = content.get("initials", "")
    renamed = content.get("name") != member.name
    if renamed and initials and initials == member.initials == derive_initials(member.name):
        return {**content, "initials": ""}
    return content


def _write_version(dossier: Dossier, version_no: int, content: dict, change_note: str, user_id: str) -> DossierVersion:
    """Insert a new immutable version with its key records and quotes. A lineageId sent by the client is
    kept (same evidence, edited); a missing one gets a new id (new evidence)."""
    version = DossierVersion.objects.create(
        dossier=dossier,
        version_no=version_no,
        change_note=change_note,
        created_by=user_id,
        **_identity(content),
        profile=content.get("profile", ""),
        political_archetype=content.get("political_archetype", ""),
        political_style=content.get("political_style", ""),
        committees=content.get("committees", []),
        issue_positions=content.get("issue_positions", []),
        voice_description=content.get("voice_description", ""),
        voice_example=content.get("voice_example", {}),
        mayor_alignment=content.get("mayor_alignment", {}),
        voting_bloc=content.get("voting_bloc", ""),
        opposition_triggers=content.get("opposition_triggers", []),
        persuasion_levers=content.get("persuasion_levers", []),
        data_gaps=content.get("data_gaps", []),
    )
    KeyRecord.objects.bulk_create(
        KeyRecord(version=version, position=position, **record)
        for position, record in enumerate(content.get("key_records", []))
    )
    VoiceQuote.objects.bulk_create(
        VoiceQuote(version=version, position=position, **quote)
        for position, quote in enumerate(content.get("quotes", []))
    )
    return version


_LINEAGE_EVIDENCE = (
    ("key_records", KeyRecord, ("keyRecords",)),
    ("quotes", VoiceQuote, ("voiceEvidence", "quotes")),
)


def _check_lineage(content: dict, dossier: Dossier | None) -> None:
    """A lineageId only carries evidence forward within its own dossier: it must be one this dossier's earlier
    versions used for the same kind of evidence. A new dossier (None) has no earlier evidence, so any id is
    refused. Otherwise ids from another dossier, or another workspace, would tie unrelated evidence together."""
    for field, model, path in _LINEAGE_EVIDENCE:
        sent = {
            index: item["lineage_id"]
            for index, item in enumerate(content.get(field, []))
            if "lineage_id" in item
        }
        if not sent:
            continue
        known = (
            set()
            if dossier is None
            else set(
                model.objects.filter(version__dossier=dossier, lineage_id__in=sent.values()).values_list(
                    "lineage_id", flat=True
                )
            )
        )
        unknown = sorted(index for index, lineage_id in sent.items() if lineage_id not in known)
        if unknown:
            raise errors.unknown_lineage(path, unknown)


@transaction.atomic
def create_dossier(*, workspace_id: str, user_id: str, member_data: dict, content: dict, change_note: str) -> Dossier:
    """A new member with its dossier at version 1."""
    _check_lineage(content, None)
    member = Member.objects.create(
        workspace_id=workspace_id, created_by=user_id, **_identity(content), **member_data
    )
    dossier = Dossier.objects.create(workspace_id=workspace_id, member=member)
    dossier.current_version = _write_version(dossier, 1, content, change_note, user_id)
    dossier.save(update_fields=["current_version", "updated_at"])
    return dossier


@transaction.atomic
def save_dossier(
    *, dossier: Dossier, user_id: str, base_version_no: int, member_data: dict, content: dict, change_note: str
) -> Dossier:
    """Save the full dossier as a new version. The row lock makes the baseVersionNo check and the insert one
    step, so two people saving at once can't both win: the second gets a 409."""
    locked = Dossier.objects.select_for_update().get(pk=dossier.pk)
    member = Member.objects.get(pk=locked.member_id)
    if member.archived_at is not None:
        raise errors.dossier_archived()
    current_no = DossierVersion.objects.values_list("version_no", flat=True).get(pk=locked.current_version_id)
    if current_no != base_version_no:
        raise errors.version_conflict(current_no)
    _check_lineage(content, locked)
    content = _follow_rename(content, member)

    for field, value in {**_identity(content), **member_data}.items():
        setattr(member, field, value)
    member.save(update_fields=[*IDENTITY_FIELDS, *member_data, "updated_at"])

    locked.current_version = _write_version(locked, current_no + 1, content, change_note, user_id)
    locked.save(update_fields=["current_version", "updated_at"])
    return locked


@transaction.atomic
def archive_dossier(dossier: Dossier, user_id: str) -> None:
    """Soft delete: the member is archived, every version stays. Archiving twice is a no-op, and logs nothing."""
    archived = Member.objects.filter(pk=dossier.member_id, archived_at__isnull=True).update(
        archived_at=timezone.now(), updated_at=timezone.now()
    )
    if archived:
        DossierArchiveEvent.objects.create(
            dossier=dossier, action=DossierArchiveEvent.Action.ARCHIVED, performed_by=user_id
        )


@transaction.atomic
def restore_dossier(dossier: Dossier, user_id: str) -> None:
    """Undo an archive: the member is active and editable again. Restoring an active member is a no-op, and
    logs nothing."""
    restored = Member.objects.filter(pk=dossier.member_id, archived_at__isnull=False).update(
        archived_at=None, updated_at=timezone.now()
    )
    if restored:
        DossierArchiveEvent.objects.create(
            dossier=dossier, action=DossierArchiveEvent.Action.RESTORED, performed_by=user_id
        )
