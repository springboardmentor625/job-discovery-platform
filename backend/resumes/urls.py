from django.urls import path

from .views import ResumeListCreateView

urlpatterns = [
    path("", ResumeListCreateView.as_view(), name="resume-list-create"),
]