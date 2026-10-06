from rest_framework.authentication import BaseAuthentication


class AuthServiceJWTAuthentication(BaseAuthentication):
    """Verifies the access token issued by the Express auth service.

    TODO: decode the Bearer token with settings.JWT_SECRET (HS256, issuer, audience),
    require typ == "access" and mfa is True, and return (principal, claims)
    where principal carries user_id, workspace_id (wid) and role.
    """

    def authenticate(self, request):
        return None
