from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('candidates', '0026_alter_application_cover_letter_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='source',
            field=models.CharField(
                blank=True,
                db_index=True,
                default='dataset',
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='source_id',
            field=models.CharField(
                blank=True,
                default='',
                max_length=150,
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='posted_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='expires_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='is_active',
            field=models.BooleanField(
                db_index=True,
                default=True,
            ),
        ),
        migrations.AddConstraint(
            model_name='job',
            constraint=models.UniqueConstraint(
                condition=models.Q(source_id__gt=''),
                fields=['source', 'source_id'],
                name='unique_job_source_id',
            ),
        ),
    ]
