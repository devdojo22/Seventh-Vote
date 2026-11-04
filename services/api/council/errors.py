from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError


class Conflict(APIException):
    """409. `details` is added to the error body by core.exceptions.exception_handler."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Conflict."
    default_code = "conflict"

    def __init__(self, detail=None, code=None, details=None):
        super().__init__(detail, code)
        self.details = details


def version_conflict(current_version_no: int) -> Conflict:
    return Conflict(
        "This dossier was saved by someone else. Reload it and apply your changes again.",
        code="version_conflict",
        details={"currentVersionNo": current_version_no},
    )


def review_outdated(reviewed_version_no: int, current_version_no: int) -> Conflict:
    return Conflict(
        f"Version {current_version_no} was saved after you opened version {reviewed_version_no}, so its "
        "status wasn't changed. Review the latest version first.",
        code="version_conflict",
        details={"currentVersionNo": current_version_no},
    )


def unknown_lineage(path: tuple[str, ...], indexes: list[int]) -> ValidationError:
    """400 validation_error for evidence ids that aren't this dossier's, in the same nested shape as DRF's own
    field errors: {"content": {"keyRecords": {"0": {"lineageId": [message]}}}}."""
    message = "This evidence id isn't from an earlier version of this dossier. Leave it out for new evidence."
    body: dict = {str(index): {"lineageId": [message]} for index in indexes}
    for key in reversed(("content", *path)):
        body = {key: body}
    return ValidationError(body)


def dossier_archived() -> Conflict:
    return Conflict("This dossier is archived. Restore it before making changes.", code="dossier_archived")
