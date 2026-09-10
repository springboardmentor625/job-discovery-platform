from django.core.management.base import BaseCommand

try:
    from recommendation.train_recommendation import (
        train_recommendation_model,
    )
except ImportError:
    from candidates.recommendation.train_recommendation import (
        train_recommendation_model,
    )


class Command(BaseCommand):
    help = "Train SwipeX recommendation model"

    def handle(self, *args, **kwargs):
        self.stdout.write(
            self.style.NOTICE(
                "Training recommendation model..."
            )
        )

        train_recommendation_model()

        self.stdout.write(
            self.style.SUCCESS(
                "Training completed."
            )
        )