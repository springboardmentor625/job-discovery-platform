from rest_framework import generics, permissions

from applications.models import Application

from .models import Swipe
from .serializers import SwipeSerializer


class SwipeCreateView(generics.CreateAPIView):
    """
    POST /api/swipes/  — body: {"job": <job_id>, "direction": "left" | "save" | "right"}

    'Swipe Decision' in the candidate workflow:
      - left  -> just records the skip, no Application (loop back to next job)
      - save  -> creates/updates an Application with status="saved"  ('Save Job')
      - right -> creates/updates an Application with status="applied" ('Apply for Job' -> End)
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SwipeSerializer

    def perform_create(self, serializer):
        job = serializer.validated_data["job"]
        direction = serializer.validated_data["direction"]
        swipe, _ = Swipe.objects.update_or_create(
            user=self.request.user, job=job, defaults={"direction": direction}
        )
        serializer.instance = swipe

        if swipe.direction == Swipe.Direction.SAVE:
            Application.objects.update_or_create(
                user=self.request.user, job=swipe.job,
                defaults={"status": Application.Status.SAVED},
            )
        elif swipe.direction == Swipe.Direction.RIGHT:
            Application.objects.update_or_create(
                user=self.request.user, job=swipe.job,
                defaults={"status": Application.Status.APPLIED},
            )