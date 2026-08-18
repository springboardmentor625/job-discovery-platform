from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    CandidateViewSet,
    ResumeViewSet,
    JobViewSet,
    JobSwipeViewSet,
)
from .views import ApplicationViewSet

router = DefaultRouter()


# =========================
# CANDIDATES
# =========================

router.register(
    r"candidates",
    CandidateViewSet,
    basename="candidate"
)


# =========================
# RESUMES
# =========================

router.register(
    r"resumes",
    ResumeViewSet,
    basename="resume"
)


# =========================
# JOBS
# =========================

router.register(
    r"jobs",
    JobViewSet,
    basename="job"
)


# =========================
# JOB SWIPES
# =========================

router.register(
    r"swipes",
    JobSwipeViewSet,
    basename="swipe"
)

router.register(
    r'applications',
    ApplicationViewSet,
    basename='application'
)

urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register"
    ),

    path(
        "",
        include(router.urls)
    ),
]