from django.urls import path
from .views import RegisterView, LoginView, VerifyEmailView
from .views import ResumeUploadView, ResumeDeleteView, JobSwipeView, SavedJobsView, SwipeHistoryView
from .views import CandidateProfileView, ATSMatchView, RecommendationView
from .views import JobListView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resume/upload/", ResumeUploadView.as_view(), name="resume-upload"),
    path("resume/delete/", ResumeDeleteView.as_view(), name="resume-delete"),
    path("jobs/swipe/",JobSwipeView.as_view(),name="job-swipe"),
    path("jobs/saved/", SavedJobsView.as_view(), name="saved-jobs"),
    path("jobs/swipe-history/",SwipeHistoryView.as_view(),name="swipe-history"),
    path("profile/", CandidateProfileView.as_view(), name="candidate-profile"),
    path("ats/jobs/<int:job_id>/",ATSMatchView.as_view(),name="ats-match"),
    path("jobs/",JobListView.as_view(),name="job-list"),
    path("recommendations/", RecommendationView.as_view(), name="recommendations"),
]