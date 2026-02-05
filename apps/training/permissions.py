"""Training permissions"""
from rest_framework import permissions


class TrainingManagePermission(permissions.BasePermission):
    """
    Allow read-only access to all authenticated users.
    Write access only to superusers or HR admins/managers or users with training.manage permission.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user.is_superuser:
            return True

        if hasattr(request.user, 'has_role'):
            if request.user.has_role('HR_ADMIN') or request.user.has_role('HR_MANAGER'):
                return True

        if hasattr(request.user, 'has_permission_for'):
            if request.user.has_permission_for('training.manage') or request.user.has_permission_for('training.edit'):
                return True

        return False
