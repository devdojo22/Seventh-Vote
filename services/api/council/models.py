import uuid

from django.db import models


class ReviewStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    IN_REVIEW = "in_review", "In review"
    APPROVED = "approved", "Approved"


class DatePrecision(models.TextChoices):
    DAY = "day", "Day"
    MONTH = "month", "Month"
    YEAR = "year", "Year"
    UNKNOWN = "unknown", "Unknown"


class Member(models.Model):
    """A council member in one workspace. Archived instead of deleted, so dossier history is kept.
    name, initials, district, leadership_role and took_office mirror the current DossierVersion (where their
    history lives) so lists don't have to join it; only services.py writes them."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace_id = models.UUIDField(db_index=True)
    slug = models.CharField(max_length=100, blank=True)
    name = models.CharField(max_length=200)
    initials = models.CharField(max_length=10)
    district = models.CharField(max_length=100, blank=True)
    leadership_role = models.TextField(blank=True)
    took_office = models.CharField(max_length=200, blank=True)
    photo_url = models.URLField(max_length=2000, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_by = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "members"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace_id", "slug"],
                condition=~models.Q(slug=""),
                name="uniq_member_slug_per_workspace",
            ),
        ]

    def __str__(self):
        return self.name


class Dossier(models.Model):
    """One per member; points at the version currently shown."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace_id = models.UUIDField(db_index=True)
    member = models.OneToOneField(Member, on_delete=models.PROTECT, related_name="dossier")
    current_version = models.OneToOneField(
        "DossierVersion", on_delete=models.PROTECT, null=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dossiers"

    def __str__(self):
        return f"Dossier: {self.member}"


class DossierVersion(models.Model):
    """An immutable snapshot of a dossier. Every save creates a new one; old rows are never changed
    except for review status, which goes through the review service and is logged."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dossier = models.ForeignKey(Dossier, on_delete=models.PROTECT, related_name="versions")
    version_no = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.DRAFT)
    change_note = models.TextField(blank=True)
    created_by = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    name = models.CharField(max_length=200, default="")
    initials = models.CharField(max_length=10, default="")
    district = models.CharField(max_length=100, blank=True)
    leadership_role = models.TextField(blank=True)
    took_office = models.CharField(max_length=200, blank=True)

    profile = models.TextField(blank=True)
    political_archetype = models.CharField(max_length=200, blank=True)
    political_style = models.TextField(blank=True)
    committees = models.JSONField(default=list)
    issue_positions = models.JSONField(default=list)

    voice_description = models.TextField(blank=True)
    voice_example = models.JSONField(default=dict)

    mayor_alignment = models.JSONField(default=dict)

    voting_bloc = models.TextField(blank=True)
    opposition_triggers = models.JSONField(default=list)
    persuasion_levers = models.JSONField(default=list)

    data_gaps = models.JSONField(default=list)

    class Meta:
        db_table = "dossier_versions"
        ordering = ["-version_no"]
        constraints = [
            models.UniqueConstraint(fields=["dossier", "version_no"], name="uniq_dossier_version_no"),
        ]

    def __str__(self):
        return f"{self.dossier} v{self.version_no}"


class KeyRecord(models.Model):
    """A vote, statement, sponsorship or other public act. lineage_id stays the same when the record is
    copied into a new version, so M4 citations survive edits."""

    class RecordType(models.TextChoices):
        VOTE = "vote", "Vote"
        STATEMENT = "statement", "Statement"
        SPONSORSHIP = "sponsorship", "Sponsorship"
        COMMITTEE_ACTION = "committee_action", "Committee action"
        OTHER = "other", "Other"

    class Outcome(models.TextChoices):
        YES = "yes", "Yes"
        NO = "no", "No"
        ABSTAIN = "abstain", "Abstain"
        SUPPORT_SIGNAL = "support_signal", "Support signal"
        NONE = "none", "None"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    version = models.ForeignKey(DossierVersion, on_delete=models.PROTECT, related_name="key_records")
    lineage_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    position = models.PositiveIntegerField()
    title = models.CharField(max_length=1000)
    record_type = models.CharField(max_length=20, choices=RecordType.choices)
    outcome = models.CharField(max_length=20, choices=Outcome.choices, default=Outcome.NONE)
    description = models.TextField(blank=True)
    source_name = models.CharField(max_length=300, blank=True)
    source_url = models.URLField(max_length=2000, blank=True)
    date = models.DateField(null=True, blank=True)
    date_precision = models.CharField(max_length=10, choices=DatePrecision.choices, default=DatePrecision.UNKNOWN)
    date_text = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "key_records"
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["version", "lineage_id"], name="uniq_key_record_lineage_per_version"),
        ]


class VoiceQuote(models.Model):
    """A quote in the member's own words. lineage_id is stable across versions, like KeyRecord."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    version = models.ForeignKey(DossierVersion, on_delete=models.PROTECT, related_name="quotes")
    lineage_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    position = models.PositiveIntegerField()
    text = models.TextField()
    context = models.CharField(max_length=1000, blank=True)
    verbatim = models.BooleanField(default=False)
    source_name = models.CharField(max_length=300, blank=True)
    source_url = models.URLField(max_length=2000, blank=True)

    class Meta:
        db_table = "voice_quotes"
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["version", "lineage_id"], name="uniq_quote_lineage_per_version"),
        ]


class ReviewStatusChange(models.Model):
    """Append-only log of every review status change."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    version = models.ForeignKey(DossierVersion, on_delete=models.PROTECT, related_name="status_changes")
    from_status = models.CharField(max_length=20, choices=ReviewStatus.choices)
    to_status = models.CharField(max_length=20, choices=ReviewStatus.choices)
    changed_by = models.UUIDField()
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review_status_changes"
        ordering = ["-changed_at"]


class DossierArchiveEvent(models.Model):
    """Append-only log of who archived or restored a dossier, and when. Written only by services.py, in the
    same transaction as the change."""

    class Action(models.TextChoices):
        ARCHIVED = "archived", "Archived"
        RESTORED = "restored", "Restored"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dossier = models.ForeignKey(Dossier, on_delete=models.PROTECT, related_name="archive_events")
    action = models.CharField(max_length=20, choices=Action.choices)
    performed_by = models.UUIDField()
    performed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dossier_archive_events"
        ordering = ["-performed_at"]
