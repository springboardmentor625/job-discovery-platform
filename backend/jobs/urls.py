from django.urls import path

from .views import JobListView, RecommendedJobsView

urlpatterns = [
    path("", JobListView.as_view(), name="job-list"),
    path("recommended/", RecommendedJobsView.as_view(), name="job-recommended"),
]