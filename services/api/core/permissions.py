from rest_framework.permissions import BasePermission


class IsWorkspaceCAO(BasePermission):
    """TODO: allow only tokens with role == "CAO" and an active workspace (wid)."""

    def has_permission(self, request, view):
        return False
