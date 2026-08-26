from django.urls import path
from .views import RegisterView, LoginView, VerifyEmailView
from .views import ResumeUploadView, ResumeDeleteView
from .views import CandidateProfileView, ATSMatchView
from .views import JobListView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resume/upload/", ResumeUploadView.as_view(), name="resume-upload"),
    path("resume/delete/", ResumeDeleteView.as_view(), name="resume-delete"),
    path("profile/", CandidateProfileView.as_view(), name="candidate-profile"),
    path("ats/jobs/<int:job_id>/",ATSMatchView.as_view(),name="ats-match"),
    path("jobs/",JobListView.as_view(),name="job-list"),
]