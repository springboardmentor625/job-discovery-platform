from rest_framework import serializers

from ..models import Candidate, Application


class ApplicationService:
    """
    Handles creation of job applications.
    """

    @staticmethod
    def create_application(user, serializer):

        # =====================================
        # AUTHENTICATION
        # =====================================

        if not user or not user.is_authenticated:
            raise serializers.ValidationError({
                "detail": "Authentication required."
            })

        # =====================================
        # GET CANDIDATE
        # =====================================

        try:
            candidate = Candidate.objects.get(
                email__iexact=user.email
            )

        except Candidate.DoesNotExist:
            raise serializers.ValidationError({
                "detail": "Candidate profile not found."
            })

        # =====================================
        # GET JOB
        # =====================================

        job = serializer.validated_data.get("job")

        if not job:
            raise serializers.ValidationError({
                "job_id": "Job is required."
            })

        # =====================================
        # DUPLICATE APPLICATION
        # =====================================

        if Application.objects.filter(
            candidate=candidate,
            job=job
        ).exists():

            raise serializers.ValidationError({
                "detail": "You have already applied for this job."
            })

        # =====================================
        # CREATE APPLICATION
        # =====================================

        application = serializer.save(
            candidate=candidate
        )

        return application