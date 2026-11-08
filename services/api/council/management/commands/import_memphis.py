"""Load the Memphis research snapshot (council/fixtures/memphis_snapshot.json) into a workspace, each member
as a dossier at version 1, Draft. The fixture is the frontend's former static data exported as JSON, and is
now the only copy of it; this command only maps it onto the dossier content shape and saves it through the
same serializer and service the API uses.

    python manage.py import_memphis --dry-run
    python manage.py import_memphis

Members already in the workspace (archived ones included) are skipped, never overwritten, so running it again
is safe. They are matched by slug, and members added in the app (whose slug may differ) by name.
"""

import json
import logging
import re
import uuid
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from council.models import Member
from council.serializers import DossierContentSerializer
from council.services import create_dossier

logger = logging.getLogger(__name__)

FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "memphis_snapshot.json"
DEFAULT_WORKSPACE = "memphis-city-council"
CHANGE_NOTE = "Imported from the Sep 16, 2026 research snapshot."
# created_by on imported rows: no person made them. The UI shows it as "Workspace member".
IMPORT_USER_ID = str(uuid.UUID(int=0))

_HTTP_URL = re.compile(r"^https?://", re.IGNORECASE)
# A leading YYYY, YYYY-MM or YYYY-MM-DD followed by the end or a space ("2025-04-08 (meeting; ...)").
_DATE = re.compile(r"^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?=$|\s)")
_VOTE_WORDS = {"yes": "yes", "no": "no", "abstain": "abstain"}


def _name_key(name: str) -> str:
    """A name compared without case or spacing differences: "Rhonda  logan" matches "Rhonda Logan"."""
    return " ".join(name.split()).casefold()


def _source(item: dict) -> dict:
    """The link field only takes http(s) URLs. Anything else (the snapshot has "unverified") is kept on the
    source name, so no text is lost."""
    name, url = item.get("source_name") or "", (item.get("source_url") or "").strip()
    if not url or _HTTP_URL.match(url):
        return {"sourceName": name, "sourceUrl": url}
    if name == url:
        return {"sourceName": name, "sourceUrl": ""}
    return {"sourceName": f"{name} (link {url})" if name else f"Link {url}", "sourceUrl": ""}


def _date(text: str) -> dict:
    """The leading date at its precision. The original text is kept whenever it says more than the date."""
    text = text or ""
    match = _DATE.match(text.strip())
    if not match:
        return {"date": None, "datePrecision": "unknown", "dateText": text}
    year, month, day = match.groups()
    precision = "day" if day else "month" if month else "year"
    return {
        "date": f"{year}-{month or '01'}-{day or '01'}",
        "datePrecision": precision,
        "dateText": "" if match.group(0) == text.strip() else text,
    }


def _outcome(position: str) -> str:
    """Only an explicit leading Yes / No / Abstain; anything else is "none". The full text is kept either way."""
    first_word = re.split(r"[\s(;,:]", (position or "").strip().lower(), maxsplit=1)[0]
    return _VOTE_WORDS.get(first_word, "none")


def _key_record(vote: dict) -> dict:
    outcome = _outcome(vote.get("position", ""))
    return {
        "title": vote.get("item", ""),
        "type": "vote" if outcome != "none" else "other",
        "outcome": outcome,
        "description": vote.get("position", ""),
        **_source(vote),
        **_date(vote.get("date", "")),
    }


def _content(member: dict) -> dict:
    """One snapshot member as DossierContentSerializer input. Fields that are a string in some members and an
    object in others keep both forms: the object's parts go to their own fields."""
    style = member.get("political_style", "")
    voice = member.get("twin_voice", "")
    mayor = member.get("mayor_alignment", "")
    return {
        "name": member.get("name", ""),
        "district": member.get("district", ""),
        "leadershipRole": member.get("leadership_role", ""),
        "tookOffice": str(member.get("took_office", "")),
        "profile": member.get("bio", ""),
        "politicalArchetype": style.get("archetype", "") if isinstance(style, dict) else "",
        "politicalStyle": style.get("description", "") if isinstance(style, dict) else style,
        "committees": [{"committee": name, "role": role} for name, role in member.get("committees", {}).items()],
        "issuePositions": [
            {"topic": topic, "stance": p.get("stance", ""), "evidence": p.get("evidence", ""), **_source(p)}
            for topic, p in member.get("issue_positions", {}).items()
        ],
        "keyRecords": [_key_record(vote) for vote in member.get("key_votes", [])],
        "voiceEvidence": {
            "description": voice.get("style", "") if isinstance(voice, dict) else voice,
            "example": (
                {"quote": voice.get("example_quote", ""), "context": voice.get("example_context", ""), **_source(voice)}
                if isinstance(voice, dict)
                else {}
            ),
            "quotes": [
                {
                    "text": q.get("quote", ""),
                    "context": q.get("context", ""),
                    "verbatim": bool(q.get("verbatim", False)),
                    **_source(q),
                }
                for q in member.get("notable_quotes", [])
            ],
        },
        "decisionPattern": {
            "votingBloc": member.get("voting_bloc", ""),
            "oppositionTriggers": [{"text": t} for t in member.get("opposition_triggers", [])],
            "persuasionLevers": [{"text": t} for t in member.get("persuasion_levers", [])],
        },
        # The string form has no separate relationship label; the whole text is the example.
        "mayorAlignment": (
            {"relationship": mayor.get("relationship", ""), "example": mayor.get("example", ""), **_source(mayor)}
            if isinstance(mayor, dict)
            else {"example": mayor}
        ),
        "dataGaps": member.get("data_gaps", []),
    }


class Command(BaseCommand):
    help = "Import the Memphis research snapshot into a workspace as version 1, Draft dossiers."

    def add_arguments(self, parser):
        parser.add_argument(
            "--workspace", default=DEFAULT_WORKSPACE, help=f"Workspace slug (default: {DEFAULT_WORKSPACE})."
        )
        parser.add_argument("--dry-run", action="store_true", help="Validate and roll back; nothing is saved.")

    def handle(self, *args, workspace, dry_run, **options):
        workspace_id = self._workspace_id(workspace)
        members = self._load_fixture()

        slugs = [m["id"] for m in members]
        by_slug = set(
            Member.objects.filter(workspace_id=workspace_id, slug__in=slugs).values_list("slug", flat=True)
        )
        added_in_app = {
            _name_key(name)
            for name in Member.objects.filter(workspace_id=workspace_id)
            .exclude(slug__in=slugs)
            .values_list("name", flat=True)
        }
        by_name = {
            m["id"]: m["name"]
            for m in members
            if m["id"] not in by_slug and _name_key(m["name"]) in added_in_app
        }
        existing = by_slug | set(by_name)
        to_import = [m for m in members if m["id"] not in existing]
        for slug in sorted(by_slug):
            self.stdout.write(self.style.WARNING(f"  skip {slug}: already in {workspace}"))
        for slug, name in sorted(by_name.items()):
            self.stdout.write(
                self.style.WARNING(f"  skip {slug}: a member named {name!r} was already added in the app")
            )

        # Validate everything before writing anything.
        contents, invalid = [], []
        for member in to_import:
            serializer = DossierContentSerializer(data=_content(member))
            if serializer.is_valid():
                contents.append((member["id"], serializer.validated_data))
            else:
                invalid.append(f"{member['id']}: {json.dumps(serializer.errors)}")
        if invalid:
            raise CommandError("Nothing was imported. Invalid members:\n  " + "\n  ".join(invalid))

        with transaction.atomic():
            for slug, content in contents:
                create_dossier(
                    workspace_id=workspace_id,
                    user_id=IMPORT_USER_ID,
                    member_data={"slug": slug},
                    content=content,
                    change_note=CHANGE_NOTE,
                )
                self.stdout.write(f"  {'valid' if dry_run else 'imported'} {slug}")
            if dry_run:
                transaction.set_rollback(True)

        summary = (
            f"{'Dry run, nothing saved' if dry_run else 'Done'}: {len(contents)} "
            f"{'would be imported' if dry_run else 'imported'}, {len(existing)} skipped (already present), "
            f"workspace {workspace}."
        )
        logger.info("import_memphis %s", summary)
        self.stdout.write(self.style.SUCCESS(summary))

    def _load_fixture(self) -> list[dict]:
        try:
            members = json.loads(FIXTURE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise CommandError(f"Can't read {FIXTURE.name}: {error}") from error
        if not isinstance(members, list) or not all(isinstance(m, dict) and m.get("id") for m in members):
            raise CommandError(f"{FIXTURE.name} must be a list of members, each with an id.")
        slugs = [m["id"] for m in members]
        duplicates = sorted({s for s in slugs if slugs.count(s) > 1})
        if duplicates:
            raise CommandError(f"{FIXTURE.name} has duplicate ids: {', '.join(duplicates)}")
        return members

    def _workspace_id(self, slug: str) -> str:
        """The workspace lives in the auth service's schema; both services share the database."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, archived_at FROM auth.workspaces WHERE slug = %s", [slug])
            row = cursor.fetchone()
        if row is None:
            raise CommandError(f"No workspace with slug {slug!r}. Create it (or run the auth seed) first.")
        if row[1] is not None:
            raise CommandError(f"Workspace {slug!r} is archived.")
        return str(row[0])
