"""M4: the AI settings (core/settings.py) control the code that uses them. No model download, no Claude call."""

from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from unittest import mock

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APITestCase

from ai import embeddings
from ai.embeddings import DossierEmbedder, check_model_dimensions
from ai.llm import ask_member
from ai.retrieval import find_evidence
from ai.tests.helpers import fake_claude, make_dossier
from simulation.services import run_simulation

SMALL_MODEL = {"model": "BAAI/bge-small-en-v1.5", "dim": 384}


class EmbeddingModelConfigTests(SimpleTestCase):
    """TextEmbedding is mocked: the configured model is checked and constructed, never downloaded."""

    def setUp(self):
        embeddings.load_model.cache_clear()
        self.addCleanup(embeddings.load_model.cache_clear)  # the next test loads the real model again
        patcher = mock.patch("ai.embeddings.TextEmbedding")
        self.TextEmbedding = patcher.start()
        self.addCleanup(patcher.stop)
        self.TextEmbedding.list_supported_models.return_value = [
            SMALL_MODEL,
            {"model": "BAAI/bge-base-en-v1.5", "dim": 768},
        ]

    @override_settings(EMBEDDING_MODEL="BAAI/bge-small-en-v1.5", EMBEDDING_CACHE_DIR="/configured/cache")
    def test_uses_the_configured_model_and_cache_dir(self):
        DossierEmbedder()
        self.TextEmbedding.assert_called_once_with("BAAI/bge-small-en-v1.5", cache_dir="/configured/cache")

    def test_model_is_loaded_once(self):
        DossierEmbedder()
        DossierEmbedder()
        self.assertEqual(self.TextEmbedding.call_count, 1)

    @override_settings(EMBEDDING_MODEL="BAAI/bge-base-en-v1.5")
    def test_model_with_another_vector_size_is_refused_before_loading(self):
        with self.assertRaises(ImproperlyConfigured) as raised:
            DossierEmbedder()
        self.assertIn("768", str(raised.exception))
        self.assertIn("384", str(raised.exception))
        self.TextEmbedding.assert_not_called()

    @override_settings(EMBEDDING_MODEL="no/such-model")
    def test_unknown_model_is_refused_before_loading(self):
        with self.assertRaises(ImproperlyConfigured):
            DossierEmbedder()
        self.TextEmbedding.assert_not_called()


class DimensionGuardTests(SimpleTestCase):
    """The guard against fastembed's real model list (metadata only, nothing is downloaded)."""

    def test_default_model_fits_the_column(self):
        check_model_dimensions("BAAI/bge-small-en-v1.5")

    def test_a_768_dimension_model_does_not(self):
        with self.assertRaises(ImproperlyConfigured):
            check_model_dimensions("BAAI/bge-base-en-v1.5")


class EvidenceCountTests(APITestCase):
    """The test dossier has 7 pieces, so any count up to 7 is visible. Defaults: core/tests/test_env.py."""

    @override_settings(SIMULATION_EVIDENCE_COUNT=2)
    def test_setting_controls_the_count(self):
        self.assertEqual(len(find_evidence(make_dossier().current_version, "data center")), 2)

    @override_settings(SIMULATION_EVIDENCE_COUNT=2)
    def test_explicit_k_still_wins(self):
        self.assertEqual(len(find_evidence(make_dossier().current_version, "data center", k=4)), 4)


@override_settings(ANTHROPIC_API_KEY="test-key")
class LlmTokenTests(SimpleTestCase):
    VERSION = SimpleNamespace(name="Dana Data", district="District 1", political_style="")
    AGENDA = {"title": "Item", "description": "Pitch"}

    @override_settings(LLM_MAX_TOKENS=1234)
    def test_setting_controls_max_tokens(self):
        with fake_claude() as create:
            ask_member(self.VERSION, self.AGENDA, [])
        self.assertEqual(create.call_args.kwargs["max_tokens"], 1234)


class SimulationWorkerTests(APITestCase):
    @override_settings(SIMULATION_MAX_WORKERS=3)
    def test_setting_controls_parallel_claude_calls(self):
        dossiers = [make_dossier(), make_dossier()]
        with fake_claude(), mock.patch(
            "simulation.services.ThreadPoolExecutor", wraps=ThreadPoolExecutor
        ) as pool:
            run = run_simulation(
                workspace_id=dossiers[0].workspace_id,
                user_id=dossiers[0].member.created_by,
                agenda={"title": "Item", "description": "Pitch"},
                dossiers=dossiers,
            )
        pool.assert_called_once_with(max_workers=3)
        self.assertEqual((run.status, len(run.answers)), ("done", 2))
