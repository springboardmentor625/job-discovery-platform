from django.db import migrations, models


def convert_applied_to_interested(apps, schema_editor):
    Application = apps.get_model("applications", "Application")
    Application.objects.filter(status="applied").update(status="interested")


def convert_interested_to_applied(apps, schema_editor):
    # for reverse migrations only
    Application = apps.get_model("applications", "Application")
    Application.objects.filter(status="interested").update(status="applied")


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0003_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='application',
            name='status',
            field=models.CharField(choices=[('saved', 'Saved'), ('interested', 'Interested'), ('skipped', 'Skipped'), ('interview', 'Interview'), ('shortlisted', 'Shortlisted'), ('rejected', 'Rejected')], default='saved', max_length=20),
        ),
        migrations.RunPython(convert_applied_to_interested, convert_interested_to_applied),
    ]