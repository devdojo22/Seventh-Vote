from django.contrib import admin

from council.models import Dossier, DossierVersion, KeyRecord, Member, ReviewStatusChange, VoiceQuote


class ReadOnlyAdmin(admin.ModelAdmin):
    """Version history is append-only: viewable here, but never edited or deleted outside the API."""

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class ReadOnlyInline(admin.TabularInline):
    extra = 0
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


class KeyRecordInline(ReadOnlyInline):
    model = KeyRecord
    fields = ["position", "title", "record_type", "outcome", "date_text", "source_url", "lineage_id"]


class VoiceQuoteInline(ReadOnlyInline):
    model = VoiceQuote
    fields = ["position", "text", "source_url", "lineage_id"]


class ReviewStatusChangeInline(ReadOnlyInline):
    model = ReviewStatusChange
    fields = ["from_status", "to_status", "changed_by", "changed_at"]
    readonly_fields = ["changed_at"]


@admin.register(Member)
class MemberAdmin(ReadOnlyAdmin):
    """Read-only too: a member's name, initials and district mirror its current dossier version, so they change
    only through a dossier save (services.py). Archiving and restoring go through the API as well."""

    list_display = ["name", "initials", "district", "slug", "workspace_id", "archived_at"]
    list_filter = ["workspace_id", "archived_at"]
    search_fields = ["name", "initials", "district", "slug"]


@admin.register(Dossier)
class DossierAdmin(ReadOnlyAdmin):
    list_display = ["member", "current_version", "workspace_id", "updated_at"]
    list_filter = ["workspace_id"]
    search_fields = ["member__name"]
    list_select_related = ["member", "current_version"]


@admin.register(DossierVersion)
class DossierVersionAdmin(ReadOnlyAdmin):
    list_display = ["dossier", "version_no", "status", "change_note", "created_by", "created_at"]
    list_filter = ["status"]
    search_fields = ["dossier__member__name", "change_note"]
    list_select_related = ["dossier__member"]
    inlines = [KeyRecordInline, VoiceQuoteInline, ReviewStatusChangeInline]


@admin.register(KeyRecord)
class KeyRecordAdmin(ReadOnlyAdmin):
    list_display = ["title", "record_type", "outcome", "date_text", "version", "lineage_id"]
    list_filter = ["record_type", "outcome", "date_precision"]
    search_fields = ["title", "description", "lineage_id"]


@admin.register(VoiceQuote)
class VoiceQuoteAdmin(ReadOnlyAdmin):
    list_display = ["text", "source_url", "version", "lineage_id"]
    search_fields = ["text", "lineage_id"]


@admin.register(ReviewStatusChange)
class ReviewStatusChangeAdmin(ReadOnlyAdmin):
    list_display = ["version", "from_status", "to_status", "changed_by", "changed_at"]
    list_filter = ["to_status"]
