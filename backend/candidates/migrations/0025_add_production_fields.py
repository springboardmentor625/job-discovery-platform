from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('candidates', '0024_alter_job_description'),
    ]

    operations = [
        # Candidate fields
        migrations.AddField(
            model_name='candidate',
            name='current_location',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AddField(
            model_name='candidate',
            name='preferred_job_roles',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='candidate',
            name='preferred_locations',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='candidate',
            name='preferred_work_mode',
            field=models.CharField(blank=True, default='Any', max_length=50),
        ),
        migrations.AddField(
            model_name='candidate',
            name='career_interests',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='candidate',
            name='bio',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='candidate',
            name='full_name',
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name='candidate',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=30),
        ),
        migrations.AlterField(
            model_name='candidate',
            name='experience',
            field=models.TextField(blank=True, default=''),
        ),

        # Job fields
        migrations.AddField(
            model_name='job',
            name='work_mode',
            field=models.CharField(blank=True, default='On-site', max_length=50),
        ),
        migrations.AddField(
            model_name='job',
            name='salary',
            field=models.CharField(blank=True, default='Competitive', max_length=100),
        ),
        migrations.AddField(
            model_name='job',
            name='experience',
            field=models.CharField(blank=True, default='Entry to Mid Level', max_length=100),
        ),
        migrations.AddField(
            model_name='job',
            name='preferred_skills',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='job',
            name='application_url',
            field=models.URLField(blank=True, default='', max_length=1000),
        ),
        migrations.AddField(
            model_name='job',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AlterField(
            model_name='job',
            name='title',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='job',
            name='company',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='job',
            name='location',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='job',
            name='required_skills',
            field=models.TextField(blank=True, default=''),
        ),

        # JobSwipe decision
        migrations.AlterField(
            model_name='jobswipe',
            name='decision',
            field=models.CharField(
                choices=[
                    ('interested', 'Interested'),
                    ('saved', 'Saved'),
                    ('skipped', 'Skipped'),
                    ('right', 'Interested'),
                    ('left', 'Skipped'),
                ],
                max_length=20,
            ),
        ),

        # Application adjustments
        migrations.AlterField(
            model_name='application',
            name='expected_salary',
            field=models.CharField(blank=True, default='', max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='application',
            name='available_from',
            field=models.CharField(blank=True, default='', max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='application',
            name='candidate',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='applications', to='candidates.candidate'),
        ),
        migrations.AlterField(
            model_name='application',
            name='job',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='applications', to='candidates.job'),
        ),
        migrations.AddConstraint(
            model_name='application',
            constraint=models.UniqueConstraint(fields=('candidate', 'job'), name='unique_candidate_job_application'),
        ),
    ]
