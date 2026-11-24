import json
import uuid
from dataclasses import dataclass, field
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import jwt
from django.conf import settings
from rest_framework import status
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import APIException, AuthenticationFailed


ROLES = {"PRINCIPAL", "AFFILIATE"}
AUTH_ACCESS_TIMEOUT_SECONDS = 5


class AuthServiceUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Authentication service unavailable."
    default_code = "auth_service_unavailable"


@dataclass(frozen=True)
class AuthenticatedPrincipal:
    """The caller, as the auth service's database says now: never the role or workspace claims of the token."""

    user_id: str
    is_super_admin: bool
    workspace_id: str | None
    role: str | None
    permissions: dict[str, bool] | None = field(default=None)
    # M4/04: the workspace's vote rules {"bodySize", "majorityThreshold", "quorum", "actions", "recusal",
    # "tieBreak"}; None until its Principal sets them. Saved with each simulation run as they were at its start.
    vote_rules: dict | None = field(default=None)
    is_authenticated = True


VOTE_RULE_KEYS = ("bodySize", "majorityThreshold", "quorum")
# The auth service's RecusalMode and TieBreak; the first of each is its column default.
RECUSAL_MODES = ("excluded", "present")
TIE_BREAKS = ("fails", "chair", "passes")


def _vote_rules(value) -> dict | None:
    """The vote rules from /auth/me/access, or None if they are not set or the three numbers are not the expected
    shape. The procedure (actions, recusal, tie-break) is kept too, read as leniently as the auth service reads it:
    non-object actions are dropped, and an unknown recusal or tie-break is its default."""
    if not isinstance(value, dict):
        return None
    rules = {key: value.get(key) for key in VOTE_RULE_KEYS}
    if not all(isinstance(n, int) and not isinstance(n, bool) and n >= 1 for n in rules.values()):
        return None
    actions = value.get("actions")
    rules["actions"] = [a for a in actions if isinstance(a, dict)] if isinstance(actions, list) else []
    rules["recusal"] = value.get("recusal") if value.get("recusal") in RECUSAL_MODES else RECUSAL_MODES[0]
    rules["tieBreak"] = value.get("tieBreak") if value.get("tieBreak") in TIE_BREAKS else TIE_BREAKS[0]
    return rules


def _is_uuid(value) -> bool:
    if not isinstance(value, str):
        return False
    try:
        uuid.UUID(value)
    except ValueError:
        return False
    return True


def _verified_claims(token: str) -> dict:
    """Signature, expiry, issuer, audience and claim shapes; every failure is the same 401."""
    try:
        claims = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
            options={"require": ["exp", "iss", "aud", "sub"]},
        )
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid or expired token")
    sv = claims.get("sv")
    valid = (
        claims.get("typ") == "access"
        and claims.get("mfa") is True
        and _is_uuid(claims.get("sub"))
        and (claims.get("wid") is None or _is_uuid(claims.get("wid")))
        and (claims.get("role") is None or claims.get("role") in ROLES)
        # bool is an int subclass in Python; the contract is a non-negative integer.
        and isinstance(sv, int)
        and not isinstance(sv, bool)
        and sv >= 0
    )
    if not valid:
        raise AuthenticationFailed("Invalid or expired token")
    return claims


def _current_access(token: str) -> dict:
    """GET /auth/me/access with the caller's own token: the auth service checks sv against
    users.security_version and returns only the super-admin flag, role and permissions from its database
    (one membership lookup, no profile). 401 there is 401 here."""
    request = Request(
        f"{settings.AUTH_SERVICE_URL}/auth/me/access",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=AUTH_ACCESS_TIMEOUT_SECONDS) as response:
            return json.load(response)
    except HTTPError as error:
        if error.code == status.HTTP_401_UNAUTHORIZED:
            raise AuthenticationFailed("Invalid or expired token")
        raise AuthServiceUnavailable()
    except (URLError, TimeoutError, ValueError):
        raise AuthServiceUnavailable()


class AuthServiceJWTAuthentication(BaseAuthentication):
    """Verifies the access token issued by the auth service, then asks it who the caller is now.

    The token is checked locally first, so malformed or forged tokens never reach the auth service. Whether it
    is still current (security version, account exists) and what the caller may do come from the auth service
    on every request, so a password change, removal or role change takes effect on the next request. Returns
    (AuthenticatedPrincipal, claims).
    """

    keyword = b"bearer"

    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts or parts[0].lower() != self.keyword:
            return None
        if len(parts) != 2:
            raise AuthenticationFailed("Invalid or expired token")
        token = parts[1].decode("ascii", errors="replace")

        claims = _verified_claims(token)
        account = _current_access(token)
        if account.get("id") != claims["sub"]:
            raise AuthenticationFailed("Invalid or expired token")

        workspace_id = account.get("activeWorkspaceId")
        principal = AuthenticatedPrincipal(
            user_id=claims["sub"],
            is_super_admin=account.get("isSuperAdmin") is True,
            # Only the token's own workspace, and only while the membership still exists.
            workspace_id=workspace_id if workspace_id == claims.get("wid") else None,
            role=account.get("role") if workspace_id == claims.get("wid") else None,
            permissions=account.get("permissions") if workspace_id == claims.get("wid") else None,
            vote_rules=_vote_rules(account.get("voteRules")) if workspace_id == claims.get("wid") else None,
        )
        return principal, claims

    def authenticate_header(self, request):
        return "Bearer"
