from django.db import migrations
from django.utils.text import slugify


def backfill_member_slugs(apps, schema_editor):
    """Dossier URLs use the member's slug, so members added in the app before that need one."""
    Member = apps.get_model("council", "Member")
    for member in Member.objects.filter(slug="").order_by("created_at"):
        taken = set(Member.objects.filter(workspace_id=member.workspace_id).values_list("slug", flat=True))
        taken.add("new")  # the /dossiers/new page
        base = slugify(member.name)[:90].strip("-") or "member"
        slug, suffix = base, 2
        while slug in taken:
            slug, suffix = f"{base}-{suffix}", suffix + 1
        Member.objects.filter(pk=member.pk).update(slug=slug)


class Migration(migrations.Migration):

    dependencies = [
        ("council", "0004_dossier_archive_events"),
    ]

    operations = [
        migrations.RunPython(backfill_member_slugs, migrations.RunPython.noop),
    ]
