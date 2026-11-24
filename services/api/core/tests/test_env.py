"""Deployment configuration: the typed env helpers, and core/settings.py loaded in a clean environment."""

import os
import runpy
from pathlib import Path
from unittest import mock

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from core.env import env_choice, env_int, env_str

SETTINGS_FILE = Path(__file__).resolve().parents[1] / "settings.py"
REQUIRED = {
    "DJANGO_SECRET_KEY": "test",
    "POSTGRES_DB": "db",
    "POSTGRES_USER": "user",
    "POSTGRES_PASSWORD": "password",
    "JWT_SECRET": "secret",
}


def load_settings(**env):
    """core/settings.py evaluated with only the required variables plus `env` set."""
    with mock.patch.dict(os.environ, {**REQUIRED, **env}, clear=True):
        return runpy.run_path(str(SETTINGS_FILE))


class EnvHelperTests(SimpleTestCase):
    def env(self, **values):
        return mock.patch.dict(os.environ, values, clear=True)

    def test_unset_or_blank_takes_the_default(self):
        for env in ({}, {"X": ""}, {"X": "   "}):
            with self.subTest(env=env), self.env(**env):
                self.assertEqual(env_str("X", "fallback"), "fallback")
                self.assertEqual(env_int("X", 7, minimum=1, maximum=9), 7)
                self.assertEqual(env_choice("X", "a", ("a", "b")), "a")

    def test_valid_values_are_used(self):
        with self.env(S=" text ", I=" 5 ", C="b"):
            self.assertEqual(env_str("S", "x"), "text")
            self.assertEqual(env_int("I", 1, minimum=1, maximum=9), 5)
            self.assertEqual(env_choice("C", "a", ("a", "b")), "b")

    def test_range_is_inclusive(self):
        for value in ("1", "9"):
            with self.subTest(value=value), self.env(I=value):
                self.assertEqual(env_int("I", 5, minimum=1, maximum=9), int(value))

    def test_invalid_values_fail_with_the_variable_name(self):
        cases = {
            "not a number": ({"I": "ten"}, lambda: env_int("I", 1, minimum=1, maximum=9)),
            "a decimal": ({"I": "2.5"}, lambda: env_int("I", 1, minimum=1, maximum=9)),
            "below the range": ({"I": "0"}, lambda: env_int("I", 1, minimum=1, maximum=9)),
            "above the range": ({"I": "10"}, lambda: env_int("I", 1, minimum=1, maximum=9)),
            "not a choice": ({"C": "z"}, lambda: env_choice("C", "a", ("a", "b"))),
        }
        for name, (env, read) in cases.items():
            with self.subTest(name), self.env(**env):
                with self.assertRaises(ImproperlyConfigured) as raised:
                    read()
                self.assertIn(next(iter(env)), str(raised.exception))


class SettingsTests(SimpleTestCase):
    def test_defaults_are_the_values_the_app_was_built_with(self):
        settings = load_settings()
        self.assertEqual(settings["LLM_MODEL"], "claude-opus-5-5")
        self.assertEqual(settings["LLM_EFFORT"], "medium")
        self.assertEqual(settings["LLM_MAX_TOKENS"], 16000)
        self.assertEqual(settings["EMBEDDING_MODEL"], "BAAI/bge-small-en-v1.5")
        self.assertEqual(settings["EMBEDDING_CACHE_DIR"], "/models")
        self.assertEqual(settings["SIMULATION_EVIDENCE_COUNT"], 6)
        self.assertEqual(settings["SIMULATION_MAX_WORKERS"], 13)
        self.assertIsNone(settings["ANTHROPIC_API_KEY"])

    def test_environment_controls_the_settings(self):
        settings = load_settings(
            LLM_MODEL="claude-sonnet-5-5",
            LLM_EFFORT="high",
            LLM_MAX_TOKENS="8000",
            EMBEDDING_MODEL="BAAI/bge-small-en",
            EMBEDDING_CACHE_DIR="/cache",
            SIMULATION_EVIDENCE_COUNT="10",
            SIMULATION_MAX_WORKERS="4",
        )
        self.assertEqual(
            [settings[k] for k in ("LLM_MODEL", "LLM_EFFORT", "LLM_MAX_TOKENS", "EMBEDDING_MODEL",
                                   "EMBEDDING_CACHE_DIR", "SIMULATION_EVIDENCE_COUNT", "SIMULATION_MAX_WORKERS")],
            ["claude-sonnet-5-5", "high", 8000, "BAAI/bge-small-en", "/cache", 10, 4],
        )

    def test_invalid_configuration_stops_startup(self):
        for env in (
            {"LLM_MAX_TOKENS": "100"},
            {"LLM_MAX_TOKENS": "lots"},
            {"LLM_EFFORT": "extreme"},
            {"SIMULATION_EVIDENCE_COUNT": "0"},
            {"SIMULATION_EVIDENCE_COUNT": "21"},
            {"SIMULATION_MAX_WORKERS": "0"},
            {"SIMULATION_MAX_WORKERS": "33"},
        ):
            with self.subTest(env=env), self.assertRaises(ImproperlyConfigured):
                load_settings(**env)
