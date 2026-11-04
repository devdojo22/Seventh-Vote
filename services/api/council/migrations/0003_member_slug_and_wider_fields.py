
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('council', '0002_dossier_content_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='dossierversion',
            name='political_archetype',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='member',
            name='slug',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='dossierversion',
            name='leadership_role',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='dossierversion',
            name='took_office',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AlterField(
            model_name='keyrecord',
            name='title',
            field=models.CharField(max_length=1000),
        ),
        migrations.AlterField(
            model_name='member',
            name='leadership_role',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='member',
            name='took_office',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AlterField(
            model_name='voicequote',
            name='context',
            field=models.CharField(blank=True, max_length=1000),
        ),
        migrations.AddConstraint(
            model_name='member',
            constraint=models.UniqueConstraint(condition=models.Q(('slug', ''), _negated=True), fields=('workspace_id', 'slug'), name='uniq_member_slug_per_workspace'),
        ),
    ]
