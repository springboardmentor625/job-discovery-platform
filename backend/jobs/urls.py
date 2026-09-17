from django.urls import path

from .views import CompanyListView, JobAtsScoreView, JobDescriptionView, JobListView, RecommendedJobsView

urlpatterns = [
    path("", JobListView.as_view(), name="job-list"),
    path("recommended/", RecommendedJobsView.as_view(), name="job-recommended"),
    path("companies/", CompanyListView.as_view(), name="company-list"),
    path("<int:pk>/ats-score/", JobAtsScoreView.as_view(), name="job-ats-score"),
    path("<int:job_id>/description/", JobDescriptionView.as_view(), name="job-description"),
]