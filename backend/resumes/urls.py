from django.urls import path

from .views import ActivateResumeView, ResumeDeleteView, ResumeListCreateView

urlpatterns = [
    path("", ResumeListCreateView.as_view(), name="resume-list-create"),
    path("<int:pk>/", ResumeDeleteView.as_view(), name="resume-delete"),
    path("<int:pk>/activate/", ActivateResumeView.as_view(), name="resume-activate"),
]