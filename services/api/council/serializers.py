from rest_framework import serializers

from council.models import (
    DatePrecision,
    Dossier,
    DossierVersion,
    KeyRecord,
    Member,
    ReviewStatus,
    ReviewStatusChange,
    VoiceQuote,
)

STANCE_LABELS = ["support", "lean_support", "neutral", "lean_oppose", "oppose", "unknown"]

LONG_TEXT_MAX = 10_000  # biography, political style, voice description, voting bloc, mayor example
PARAGRAPH_MAX = 5_000  # leadership role, stance, evidence, key-record description, quotes
ITEM_TEXT_MAX = 2_000  # one opposition trigger, persuasion lever or data gap
CHANGE_NOTE_MAX = 500
KEY_RECORDS_MAX = 100
QUOTES_MAX = 50
LIST_MAX = 30  # committees, issue positions, triggers, levers, data gaps


class CommitteeSerializer(serializers.Serializer):
    committee = serializers.CharField(max_length=200)
    role = serializers.CharField(max_length=200, allow_blank=True, default="")
    year = serializers.CharField(max_length=50, allow_blank=True, default="")


class IssuePositionSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=200)
    stance = serializers.CharField(max_length=PARAGRAPH_MAX, allow_blank=True, default="")
    stanceLabel = serializers.ChoiceField(choices=STANCE_LABELS, allow_null=True, default=None)
    evidence = serializers.CharField(max_length=PARAGRAPH_MAX, allow_blank=True, default="")
    sourceName = serializers.CharField(max_length=300, allow_blank=True, default="")
    sourceUrl = serializers.URLField(max_length=2000, allow_blank=True, default="")


class DecisionBulletSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=ITEM_TEXT_MAX)
    inferred = serializers.BooleanField(default=False)


class MayorAlignmentSerializer(serializers.Serializer):
    relationship = serializers.CharField(max_length=200, allow_blank=True, default="")
    example = serializers.CharField(max_length=LONG_TEXT_MAX, allow_blank=True, default="")
    sourceName = serializers.CharField(max_length=300, allow_blank=True, default="")
    sourceUrl = serializers.URLField(max_length=2000, allow_blank=True, default="")


class VoiceExampleSerializer(serializers.Serializer):
    quote = serializers.CharField(max_length=PARAGRAPH_MAX, allow_blank=True, default="")
    context = serializers.CharField(max_length=1000, allow_blank=True, default="")
    sourceName = serializers.CharField(max_length=300, allow_blank=True, default="")
    sourceUrl = serializers.URLField(max_length=2000, allow_blank=True, default="")


# --- Evidence rows --------------------------------------------------------------------------------------


class KeyRecordSerializer(serializers.ModelSerializer):
    # Sent back on later saves to keep the same lineage; omitted for a new record.
    lineageId = serializers.UUIDField(source="lineage_id", required=False)
    type = serializers.ChoiceField(source="record_type", choices=KeyRecord.RecordType.choices)
    description = serializers.CharField(max_length=PARAGRAPH_MAX, allow_blank=True, default="")
    sourceName = serializers.CharField(source="source_name", max_length=300, allow_blank=True, default="")
    sourceUrl = serializers.URLField(source="source_url", max_length=2000, allow_blank=True, default="")
    datePrecision = serializers.ChoiceField(
        source="date_precision", choices=DatePrecision.choices, default=DatePrecision.UNKNOWN
    )
    dateText = serializers.CharField(source="date_text", max_length=100, allow_blank=True, default="")

    class Meta:
        model = KeyRecord
        fields = [
            "lineageId",
            "title",
            "type",
            "outcome",
            "description",
            "sourceName",
            "sourceUrl",
            "date",
            "datePrecision",
            "dateText",
        ]


class VoiceQuoteSerializer(serializers.ModelSerializer):
    lineageId = serializers.UUIDField(source="lineage_id", required=False)
    text = serializers.CharField(max_length=PARAGRAPH_MAX)
    sourceName = serializers.CharField(source="source_name", max_length=300, allow_blank=True, default="")
    sourceUrl = serializers.URLField(source="source_url", max_length=2000, allow_blank=True, default="")
    context = serializers.CharField(max_length=1000, allow_blank=True, default="")
    verbatim = serializers.BooleanField(default=False)

    class Meta:
        model = VoiceQuote
        fields = ["lineageId", "text", "context", "verbatim", "sourceName", "sourceUrl"]


# --- Dossier sections, grouped like the member profile screen --------------------------------------------


class VoiceEvidenceSerializer(serializers.Serializer):
    description = serializers.CharField(
        source="voice_description", max_length=LONG_TEXT_MAX, allow_blank=True, default=""
    )
    example = VoiceExampleSerializer(source="voice_example", default=dict)
    quotes = VoiceQuoteSerializer(many=True, max_length=QUOTES_MAX, default=list)


class DecisionPatternSerializer(serializers.Serializer):
    votingBloc = serializers.CharField(
        source="voting_bloc", max_length=LONG_TEXT_MAX, allow_blank=True, default=""
    )
    oppositionTriggers = DecisionBulletSerializer(
        source="opposition_triggers", many=True, max_length=LIST_MAX, default=list
    )
    persuasionLevers = DecisionBulletSerializer(
        source="persuasion_levers", many=True, max_length=LIST_MAX, default=list
    )


class DossierContentSerializer(serializers.Serializer):
    """Every editable section of one version. Used for both input (create/save) and output."""

    # Identity: versioned with the rest, mirrored onto Member by services.py.
    name = serializers.CharField(max_length=200)
    # Blank: derived from the name.
    initials = serializers.CharField(max_length=10, allow_blank=True, default="")
    district = serializers.CharField(max_length=100, allow_blank=True, default="")
    leadershipRole = serializers.CharField(
        source="leadership_role", max_length=PARAGRAPH_MAX, allow_blank=True, default=""
    )
    tookOffice = serializers.CharField(source="took_office", max_length=200, allow_blank=True, default="")

    profile = serializers.CharField(max_length=LONG_TEXT_MAX, allow_blank=True, default="")
    politicalArchetype = serializers.CharField(
        source="political_archetype", max_length=200, allow_blank=True, default=""
    )
    politicalStyle = serializers.CharField(
        source="political_style", max_length=LONG_TEXT_MAX, allow_blank=True, default=""
    )
    committees = CommitteeSerializer(many=True, max_length=LIST_MAX, default=list)
    issuePositions = IssuePositionSerializer(
        source="issue_positions", many=True, max_length=LIST_MAX, default=list
    )
    keyRecords = KeyRecordSerializer(source="key_records", many=True, max_length=KEY_RECORDS_MAX, default=list)
    voiceEvidence = VoiceEvidenceSerializer(source="*", required=False)
    decisionPattern = DecisionPatternSerializer(source="*", required=False)
    mayorAlignment = MayorAlignmentSerializer(source="mayor_alignment", default=dict)
    dataGaps = serializers.ListField(
        source="data_gaps",
        child=serializers.CharField(max_length=ITEM_TEXT_MAX),
        max_length=LIST_MAX,
        default=list,
    )

    def validate(self, attrs):
        for field, label in (("key_records", "keyRecords"), ("quotes", "voiceEvidence.quotes")):
            lineage_ids = [item["lineage_id"] for item in attrs.get(field, []) if "lineage_id" in item]
            if len(lineage_ids) != len(set(lineage_ids)):
                raise serializers.ValidationError({label: "Each lineageId may appear only once."})
        return attrs


class DossierVersionSerializer(DossierContentSerializer):
    """Output: one version with its metadata."""

    versionNo = serializers.IntegerField(source="version_no", read_only=True)
    status = serializers.CharField(read_only=True)
    changeNote = serializers.CharField(source="change_note", read_only=True)
    createdBy = serializers.UUIDField(source="created_by", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    keyRecords = KeyRecordSerializer(source="key_records.all", many=True, read_only=True)
    voiceEvidence = serializers.SerializerMethodField()

    def get_voiceEvidence(self, version):
        return {
            "description": version.voice_description,
            "example": VoiceExampleSerializer(version.voice_example).data,
            "quotes": VoiceQuoteSerializer(version.quotes.all(), many=True).data,
        }


# --- Member and dossier --------------------------------------------------------------------------------


class MemberSerializer(serializers.ModelSerializer):
    """Output only. The identity fields are the current version's; change them through the dossier content."""

    leadershipRole = serializers.CharField(source="leadership_role", read_only=True)
    tookOffice = serializers.CharField(source="took_office", read_only=True)
    photoUrl = serializers.URLField(source="photo_url", read_only=True)
    archived = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            "id",
            "slug",
            "name",
            "initials",
            "district",
            "leadershipRole",
            "tookOffice",
            "photoUrl",
            "archived",
        ]
        read_only_fields = ["id", "slug", "name", "initials", "district"]

    def get_archived(self, member):
        return member.archived_at is not None


class DossierListSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    currentVersionNo = serializers.IntegerField(source="current_version.version_no", read_only=True)
    status = serializers.CharField(source="current_version.status", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Dossier
        fields = ["id", "member", "currentVersionNo", "status", "updatedAt"]


class DossierDetailSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    currentVersion = DossierVersionSerializer(source="current_version", read_only=True)

    class Meta:
        model = Dossier
        fields = ["id", "member", "currentVersion"]


class MemberUpdateSerializer(serializers.ModelSerializer):
    """The member fields that are not versioned. Only the fields sent are changed."""

    photoUrl = serializers.URLField(source="photo_url", max_length=2000, allow_blank=True, required=False)

    class Meta:
        model = Member
        fields = ["photoUrl"]


class DossierCreateSerializer(serializers.Serializer):
    member = MemberUpdateSerializer(required=False)
    content = DossierContentSerializer()
    changeNote = serializers.CharField(max_length=CHANGE_NOTE_MAX, allow_blank=True, default="")


class DossierUpdateSerializer(serializers.Serializer):
    """PUT body. `content` is the full dossier: a section left out is saved as empty."""

    baseVersionNo = serializers.IntegerField(min_value=1)
    changeNote = serializers.CharField(max_length=CHANGE_NOTE_MAX, allow_blank=True, default="")
    member = MemberUpdateSerializer(required=False)
    content = DossierContentSerializer()


# --- Versions, review, evidence ------------------------------------------------------------------------


class DossierVersionSummarySerializer(serializers.ModelSerializer):
    versionNo = serializers.IntegerField(source="version_no")
    changeNote = serializers.CharField(source="change_note")
    createdBy = serializers.UUIDField(source="created_by")
    createdAt = serializers.DateTimeField(source="created_at")
    isCurrent = serializers.SerializerMethodField()

    class Meta:
        model = DossierVersion
        fields = ["versionNo", "status", "changeNote", "createdBy", "createdAt", "isCurrent"]

    def get_isCurrent(self, version):
        return version.id == version.dossier.current_version_id


class ReviewChangeRequestSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ReviewStatus.choices)
    # The version the reviewer looked at. Required, so a review never lands on a newer version by default.
    versionNo = serializers.IntegerField(min_value=1)


class ReviewStatusChangeSerializer(serializers.ModelSerializer):
    versionNo = serializers.IntegerField(source="version.version_no")
    fromStatus = serializers.CharField(source="from_status")
    toStatus = serializers.CharField(source="to_status")
    changedBy = serializers.UUIDField(source="changed_by")
    changedAt = serializers.DateTimeField(source="changed_at")

    class Meta:
        model = ReviewStatusChange
        fields = ["id", "versionNo", "fromStatus", "toStatus", "changedBy", "changedAt"]


class KeyRecordEvidenceSerializer(KeyRecordSerializer):
    kind = serializers.SerializerMethodField()

    class Meta(KeyRecordSerializer.Meta):
        fields = ["kind", *KeyRecordSerializer.Meta.fields]

    def get_kind(self, _record):
        return "key_record"


class QuoteEvidenceSerializer(VoiceQuoteSerializer):
    kind = serializers.SerializerMethodField()

    class Meta(VoiceQuoteSerializer.Meta):
        fields = ["kind", *VoiceQuoteSerializer.Meta.fields]

    def get_kind(self, _quote):
        return "quote"


def version_evidence(version: DossierVersion) -> list[dict]:
    """Every source one version cites, in the order the dossier shows them. Key records and quotes are
    identified by lineageId; issue positions by topic; the mayor alignment and voice example are single."""
    items = [
        {"kind": "issue_position", **IssuePositionSerializer(position).data}
        for position in version.issue_positions
    ]
    items += KeyRecordEvidenceSerializer(version.key_records.all(), many=True).data
    items += QuoteEvidenceSerializer(version.quotes.all(), many=True).data
    for kind, serializer, value in (
        ("mayor_alignment", MayorAlignmentSerializer, version.mayor_alignment),
        ("voice_example", VoiceExampleSerializer, version.voice_example),
    ):
        data = serializer(value).data
        if data["sourceName"] or data["sourceUrl"]:
            items.append({"kind": kind, **data})
    return items

