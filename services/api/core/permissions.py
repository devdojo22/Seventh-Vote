from rest_framework.permissions import BasePermission


class IsWorkspaceMember(BasePermission):
    """Default for API endpoints: a verified caller acting in an active workspace they still belong to.

    Principal and Affiliate (and a super-admin in their active workspace) all pass; what each may do there
    comes from the auth service's permission matrix (see HasWorkspacePermission). Data must be scoped to
    request.user.workspace_id, never to a workspace named by the client.
    """

    def has_permission(self, request, view):
        user = request.user
        return (
            getattr(user, "is_authenticated", False) is True
            and getattr(user, "workspace_id", None) is not None
            and getattr(user, "permissions", None) is not None
        )


class HasWorkspacePermission(IsWorkspaceMember):
    """One named permission in the active workspace, as computed by the auth service, e.g.
    permission_classes = [HasWorkspacePermission.of("editDossiers")]."""

    permission: str = ""

    @classmethod
    def of(cls, permission: str):
        return type(f"HasWorkspacePermission_{permission}", (cls,), {"permission": permission})

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.permissions.get(self.permission) is True
