from rest_framework import generics, permissions

from .models import Application
from .serializers import ApplicationSerializer


class ApplicationListView(generics.ListAPIView):
    """
    GET /api/applications/                — all of the user's saved + applied jobs
    GET /api/applications/?status=saved   — only saved jobs
    GET /api/applications/?status=applied — only applied jobs
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        qs = Application.objects.filter(user=self.request.user).order_by("-applied_at")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs