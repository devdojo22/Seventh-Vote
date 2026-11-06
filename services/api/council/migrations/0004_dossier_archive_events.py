
import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('council', '0003_member_slug_and_wider_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='DossierArchiveEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('archived', 'Archived'), ('restored', 'Restored')], max_length=20)),
                ('performed_by', models.UUIDField()),
                ('performed_at', models.DateTimeField(auto_now_add=True)),
                ('dossier', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='archive_events', to='council.dossier')),
            ],
            options={
                'db_table': 'dossier_archive_events',
                'ordering': ['-performed_at'],
            },
        ),
    ]
