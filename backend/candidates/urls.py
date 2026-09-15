from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CandidateViewSet,
    CandidateMeView,
    ResumeViewSet,
    JobViewSet,
    JobSwipeViewSet,
    ApplicationViewSet,
    RecommendationView,
    JobsLastUpdatedView,
)

from .auth_views import EmailTokenObtainPairView


router = DefaultRouter()

router.register(
    r"candidates",
    CandidateViewSet,
    basename="candidate"
)

router.register(
    r"resumes",
    ResumeViewSet,
    basename="resume"
)

router.register(
    r"jobs",
    JobViewSet,
    basename="job"
)

router.register(
    r"swipes",
    JobSwipeViewSet,
    basename="swipe"
)

router.register(
    r"applications",
    ApplicationViewSet,
    basename="application"
)


urlpatterns = [

    path(
        "register/",
        RegisterView.as_view(),
        name="register"
    ),

    path(
        "login/",
        EmailTokenObtainPairView.as_view(),
        name="token_obtain_pair"
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),

    path(
        "candidates/me/",
        CandidateMeView.as_view(),
        name="candidate-me"
    ),

    path(
        "jobs/last-updated/",
        JobsLastUpdatedView.as_view(),
        name="jobs-last-updated"
    ),

    path(
        "recommendations/",
        RecommendationView.as_view(),
        name="recommendations"
    ),

    path(
        "",
        include(router.urls)
    ),

]
