from django.conf import settings
from django.db import models
from jobs.models import Job


class Swipe(models.Model):
    class Direction(models.TextChoices):
        LEFT = "left", "Left"
        RIGHT = "right", "Right"
        SAVE = "save", "Save"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="swipes"
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="swipes")
    direction = models.CharField(max_length=5, choices=Direction.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "job")

    def __str__(self):
        return f"{self.user.email} swiped {self.direction} on {self.job.title}"
