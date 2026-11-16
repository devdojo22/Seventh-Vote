from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('council', '0005_backfill_member_slugs'),
    ]

    operations = [
        migrations.AddField(
            model_name='reviewstatuschange',
            name='note',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='reviewstatuschange',
            name='self_approved',
            field=models.BooleanField(default=False),
        ),
    ]
