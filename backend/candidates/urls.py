from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CandidateViewSet,
    ResumeViewSet,
    JobViewSet,
    JobSwipeViewSet,
    ApplicationViewSet,
)

from .auth_views import EmailTokenObtainPairView


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


# =========================
# APPLICATIONS
# =========================

router.register(
    r"applications",
    ApplicationViewSet,
    basename="application"
)


urlpatterns = [

    # Registration
    path(
        "register/",
        RegisterView.as_view(),
        name="register"
    ),

    # JWT Login using EMAIL + PASSWORD
    path(
        "login/",
        EmailTokenObtainPairView.as_view(),
        name="token_obtain_pair"
    ),

    # JWT Refresh
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),

    # API routes
    path(
        "",
        include(router.urls)
    ),
]
