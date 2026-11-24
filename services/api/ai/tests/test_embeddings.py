"""M4/03: dossier embeddings, evidence search, the approve hook and the embed_dossiers command.
Uses the real local embedding model (no network, no Claude)."""

from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from ai.embeddings import DossierEmbedder
from ai.models import DossierEmbedding
from ai.retrieval import find_evidence
from ai.tests.helpers import OTHER_WORKSPACE_ID, caller, make_dossier
from council.models import Member


class EmbeddingTests(APITestCase):
    def test_make_pieces(self):
        version = make_dossier().current_version
        pieces = DossierEmbedder().make_pieces(version)
        kinds = [p["kind"] for p in pieces]
        self.assertEqual(kinds.count("key_record"), 2)
        self.assertEqual(kinds.count("quote"), 1)
        self.assertEqual(kinds.count("issue_position"), 1)
        self.assertIn("profile", kinds)
        for p in pieces:
            self.assertTrue(p["text"].startswith(f"{version.name} (District 1). "))
        ordinance = next(p for p in pieces if "moratorium ordinance" in p["text"])
        self.assertEqual(ordinance["source_url"], "https://example.com/ordinance")

    def test_embed_version_twice_has_no_duplicates(self):
        version = make_dossier().current_version
        first = DossierEmbedder().embed_version(version)
        second = DossierEmbedder().embed_version(version)
        self.assertEqual(first, second)
        rows = DossierEmbedding.objects.filter(dossier_version=version)
        self.assertEqual(rows.count(), first)
        self.assertEqual(len(rows.first().embedding), 384)

    def test_search_puts_the_closest_piece_first(self):
        version = make_dossier().current_version
        DossierEmbedder().embed_version(version)
        pieces = find_evidence(version, "pause on new data center permits")
        self.assertIn("data center", pieces[0].text.lower())
        scores = [p.score for p in pieces]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_search_only_reads_that_version(self):
        mine = make_dossier().current_version
        other = make_dossier(workspace_id=OTHER_WORKSPACE_ID).current_version
        DossierEmbedder().embed_version(mine)
        DossierEmbedder().embed_version(other)
        pieces = find_evidence(mine, "data center")
        self.assertTrue(all(p.dossier_version_id == mine.pk for p in pieces))

    def test_first_search_embeds_the_version(self):
        version = make_dossier().current_version
        self.assertFalse(DossierEmbedding.objects.filter(dossier_version=version).exists())
        self.assertTrue(find_evidence(version, "data center"))
        self.assertTrue(DossierEmbedding.objects.filter(dossier_version=version).exists())

    def test_approve_embeds_the_version(self):
        with self.captureOnCommitCallbacks(execute=True):
            dossier = make_dossier(approve=True)
        self.assertTrue(DossierEmbedding.objects.filter(dossier_version=dossier.current_version).exists())

    def test_approve_still_works_when_embedding_fails(self):
        with mock.patch.object(DossierEmbedder, "embed_version", side_effect=RuntimeError("model broke")):
            with self.assertLogs("ai.embeddings", "ERROR"), self.captureOnCommitCallbacks(execute=True):
                dossier = make_dossier(approve=True)
        self.assertEqual(dossier.current_version.status, "approved")

    def test_command_skips_archived_members(self):
        active = make_dossier()
        archived = make_dossier()
        Member.objects.filter(pk=archived.member_id).update(archived_at=timezone.now())
        out = StringIO()
        call_command("embed_dossiers", stdout=out)
        self.assertTrue(DossierEmbedding.objects.filter(member_id=active.member_id).exists())
        self.assertFalse(DossierEmbedding.objects.filter(member_id=archived.member_id).exists())
        self.assertIn("Done.", out.getvalue())


class EvidenceSearchEndpointTests(APITestCase):
    def search(self, dossier, user=None, **query):
        if user is not None:
            self.client.force_authenticate(user=user)
        url = reverse("dossier-evidence-search", kwargs={"ref": str(dossier.id)})
        return self.client.get(url, query)

    def test_returns_results(self):
        dossier = make_dossier()
        response = self.search(dossier, caller(), q="data center moratorium")
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertEqual(body["version"], {"versionNo": 1, "status": "draft"})
        self.assertTrue(body["results"])
        self.assertEqual(set(body["results"][0]), {"score", "kind", "text", "sourceName", "sourceUrl"})

    def test_bad_q(self):
        dossier = make_dossier()
        for q in ("", "x" * 2001):
            with self.subTest(length=len(q)):
                self.assertEqual(self.search(dossier, caller(), q=q).status_code, 400)

    def test_other_workspace_is_404(self):
        dossier = make_dossier(workspace_id=OTHER_WORKSPACE_ID)
        self.assertEqual(self.search(dossier, caller(), q="data").status_code, 404)

    def test_needs_view_dossiers(self):
        dossier = make_dossier()
        self.assertEqual(self.search(dossier, caller(viewDossiers=False), q="data").status_code, 403)

    def test_needs_login(self):
        self.assertEqual(self.search(make_dossier(), q="data").status_code, 401)
