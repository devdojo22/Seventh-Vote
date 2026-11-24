"""Typed reading of deployment configuration from the environment, for core/settings.py.

An unset or blank variable takes its default. A set but invalid value fails at startup with
ImproperlyConfigured, rather than running with something unexpected."""

import os
from collections.abc import Collection

from django.core.exceptions import ImproperlyConfigured


def _raw(name: str) -> str | None:
    value = os.environ.get(name)
    if value is None or not value.strip():
        return None
    return value.strip()


def env_str(name: str, default: str) -> str:
    return _raw(name) or default


def env_int(name: str, default: int, *, minimum: int, maximum: int) -> int:
    raw = _raw(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        raise ImproperlyConfigured(f"{name} must be a whole number, got {raw!r}.") from None
    if not minimum <= value <= maximum:
        raise ImproperlyConfigured(f"{name} must be between {minimum} and {maximum}, got {value}.")
    return value


def env_choice(name: str, default: str, choices: Collection[str]) -> str:
    value = env_str(name, default)
    if value not in choices:
        raise ImproperlyConfigured(f"{name} must be one of {', '.join(sorted(choices))}, got {value!r}.")
    return value
