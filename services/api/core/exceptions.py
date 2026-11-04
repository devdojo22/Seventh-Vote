from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    """Same error body as the auth service: {"error": message, "code"?: str, "details"?: object}."""
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()
    response = drf_exception_handler(exc, context)
    if response is None:
        return None  
    if isinstance(exc, exceptions.ValidationError):
        response.data = {"error": "Validation failed", "code": "validation_error", "details": response.data}
    else:
        detail = getattr(exc, "detail", "")
        response.data = {"error": str(detail), "code": getattr(detail, "code", None) or exc.default_code}
        if getattr(exc, "details", None) is not None:
            response.data["details"] = exc.details
    return response
