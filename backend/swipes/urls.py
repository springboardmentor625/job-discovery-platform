from django.urls import path

from .views import SwipeCreateView

urlpatterns = [
    path("", SwipeCreateView.as_view(), name="swipe-create"),
]