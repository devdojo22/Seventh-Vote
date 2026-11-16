from rest_framework.permissions import BasePermission


def has_workspace_permission(user, permission: str) -> bool:
    """One named permission in the caller's active workspace, as computed by the auth service. The single place
    the permissions dict is read, for both view permission classes and service-level rules (council.review)."""
    permissions = getattr(user, "permissions", None)
    return permissions is not None and permissions.get(permission) is True


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
    """Named permissions in the active workspace, as computed by the auth service, e.g.
    permission_classes = [HasWorkspacePermission.of("editDossiers")]. With any_of(...), one of them is enough."""

    permissions: tuple[str, ...] = ()

    @classmethod
    def of(cls, permission: str):
        return cls.any_of(permission)

    @classmethod
    def any_of(cls, *permissions: str):
        return type(f"HasWorkspacePermission_{'_or_'.join(permissions)}", (cls,), {"permissions": permissions})

    def has_permission(self, request, view):
        return super().has_permission(request, view) and any(
            has_workspace_permission(request.user, permission) for permission in self.permissions
        )
