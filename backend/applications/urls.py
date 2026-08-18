from django.urls import path

from .views import ApplicationListView

urlpatterns = [
    path("", ApplicationListView.as_view(), name="application-list"),
]