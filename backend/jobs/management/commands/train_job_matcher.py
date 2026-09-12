from django.core.management.base import BaseCommand

from jobs.matching import train_matcher


class Command(BaseCommand):
    help = "Train the TF-IDF job-matching model on all jobs currently in the database."

    def handle(self, *args, **options):
        count = train_matcher()
        self.stdout.write(
            self.style.SUCCESS(
                f"Trained the matching model on {count} jobs. "
                f"Saved to backend/ml_models/. Re-run this any time jobs change."
            )
        )