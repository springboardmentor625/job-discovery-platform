"""
Notification triggers. Two real events create notifications automatically:

1. An Application's status changes — a Django signal below fires no matter
   where the status gets changed (API, Django admin, shell).
2. A job scores >=50% match for the user in RecommendedJobsView (calibrated
   to TF-IDF's realistic range — genuinely great matches peak around 50-70%,
   not 80%+).
"""
from django.db.models.signals import pre_save
from django.dispatch import receiver

from applications.models import Application

from .models import Notification

HIGH_MATCH_THRESHOLD = 50.0


@receiver(pre_save, sender=Application)
def notify_on_status_change(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        previous = Application.objects.get(pk=instance.pk)
    except Application.DoesNotExist:
        return

    if previous.status != instance.status and instance.status in (
        Application.Status.INTERVIEW,
        Application.Status.SHORTLISTED,
        Application.Status.REJECTED,
    ):
        Notification.objects.create(
            user=instance.user,
            job=instance.job,
            notification_type=Notification.NotificationType.STATUS_CHANGE,
            message=f"Your application for {instance.job.title} at {instance.job.company} "
            f"is now: {instance.get_status_display()}.",
        )


def notify_high_match(user, job, match_score):
    if match_score < HIGH_MATCH_THRESHOLD:
        return

    already_notified = Notification.objects.filter(
        user=user, job=job, notification_type=Notification.NotificationType.HIGH_MATCH
    ).exists()
    if already_notified:
        return

    Notification.objects.create(
        user=user,
        job=job,
        notification_type=Notification.NotificationType.HIGH_MATCH,
        message=f"Strong match: {job.title} at {job.company} scored {match_score}% for you.",
    )