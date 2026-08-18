from rest_framework.permissions import BasePermission

from .models import User


class IsJobSeeker(BasePermission):
    message = "Only job seekers can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.role == User.Role.JOB_SEEKER)


class IsRecruiter(BasePermission):
    message = "Only recruiters can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.role == User.Role.RECRUITER)


class IsAdmin(BasePermission):
    message = "Only admins can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.role == User.Role.ADMIN)
