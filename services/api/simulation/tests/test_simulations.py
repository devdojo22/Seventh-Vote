"""M4/04-05: POST /api/simulations and GET /api/simulations/{id}, with a fake Claude."""

import uuid

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from ai.tests.helpers import CLAUDE_ANSWER, OTHER_WORKSPACE_ID, caller, claude_reply, fake_claude, make_dossier
from council.models import Member
from simulation.models import SimulationRun

AGENDA = {"title": "Data center moratorium", "description": "A 12-month pause on permits.",
          "category": "Utilities", "ask": "Approval"}
VOTE_RULES = {"bodySize": 13, "majorityThreshold": 7, "quorum": 7}


@override_settings(ANTHROPIC_API_KEY="test-key")
class SimulationCreateTests(APITestCase):
    def post(self, body, user=None):
        self.client.force_authenticate(user=user or caller(vote_rules=VOTE_RULES))
        return self.client.post(reverse("simulation-create"), body, format="json")

    def test_one_member(self):
        dossier = make_dossier(slug="dana-data")
        with fake_claude():
            response = self.post({"agenda": AGENDA, "members": ["dana-data"]})
        self.assertEqual(response.status_code, 201, response.content)
        body = response.json()
        self.assertEqual(body["status"], "done")
        self.assertEqual(body["agenda"], AGENDA)
        self.assertEqual(body["voteRules"], VOTE_RULES)
        [answer] = body["answers"]
        self.assertEqual(answer["memberSlug"], "dana-data")
        self.assertEqual(answer["memberId"], str(dossier.member_id))
        self.assertEqual(answer["versionNo"], 1)
        for field in ("stance", "answer", "reasoning"):
            self.assertEqual(answer[field], CLAUDE_ANSWER[field])
        for field in ("confidence", "concerns", "levers", "questions"):
            self.assertEqual(answer[field], CLAUDE_ANSWER[field])
        self.assertEqual(answer["citations"][0]["label"], "E1")
        self.assertEqual(set(answer["citations"][0]), {"label", "kind", "text", "sourceName", "sourceUrl"})

    def test_whole_council(self):
        make_dossier()
        make_dossier()
        make_dossier(workspace_id=OTHER_WORKSPACE_ID)
        with fake_claude() as create:
            response = self.post({"agenda": AGENDA})
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(len(response.json()["answers"]), 2)
        self.assertEqual(create.call_count, 2)

    def test_run_is_saved(self):
        make_dossier(slug="dana-data")
        with fake_claude():
            run_id = self.post({"agenda": AGENDA, "members": ["dana-data"]}).json()["id"]
        run = SimulationRun.objects.get(id=run_id)
        self.assertEqual(run.status, "done")
        self.assertEqual(run.answers[0]["confidence"], "Medium")
        self.assertEqual(run.answers[0]["questions"], CLAUDE_ANSWER["questions"])

    def test_claude_fails(self):
        make_dossier(slug="dana-data")
        with fake_claude(claude_reply(stop_reason="refusal")), self.assertLogs("simulation.services", level="ERROR"):
            response = self.post({"agenda": AGENDA, "members": ["dana-data"]})
        self.assertEqual(response.status_code, 502)
        body = response.json()
        self.assertEqual(body["code"], "simulation_failed")
        self.assertIn("refusal", body["error"])
        run = SimulationRun.objects.get(id=body["details"]["runId"])
        self.assertEqual(run.status, "failed")
        self.assertIn("refusal", run.error)

    def test_bad_requests_save_nothing(self):
        make_dossier(slug="dana-data")
        bodies = {
            "no agenda": {},
            "no title": {"agenda": {"description": "x"}},
            "no description": {"agenda": {"title": "x"}},
            "unknown member": {"agenda": AGENDA, "members": ["nobody"]},
            "other workspace member": {"agenda": AGENDA, "members": ["other-member"]},
        }
        make_dossier(slug="other-member", workspace_id=OTHER_WORKSPACE_ID)
        with fake_claude() as create:
            for name, body in bodies.items():
                with self.subTest(name):
                    self.assertEqual(self.post(body).status_code, 400)
        create.assert_not_called()
        self.assertFalse(SimulationRun.objects.exists())

    # --- M4/05: item context ------------------------------------------------------------------------------

    CONTEXT = {
        "actionType": "Ordinary ordinance",
        "fiscalImpact": "cost",
        "mayorPriority": True,
        "districtImpact": "specific",
        "districts": ["District 1"],
        "committee": "Public Works",
        "committeeChair": "",
    }

    def test_context_is_saved_and_sent_to_claude(self):
        make_dossier(slug="dana-data")
        with fake_claude() as create:
            response = self.post({"agenda": {**AGENDA, "context": self.CONTEXT}, "members": ["dana-data"]})
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["agenda"]["context"], self.CONTEXT)
        question = create.call_args.kwargs["messages"][0]["content"]
        for line in ("- Fiscal impact: Costs the city money", "- Mayor's priority: Yes",
                     "- District impact: Specific seat(s): District 1", "- Committee referral: Public Works",
                     "- Committee chair: not entered", "- Action type: Ordinary ordinance"):
            self.assertIn(line, question)

    def test_bad_context_is_400(self):
        make_dossier(slug="dana-data")
        bad = {
            "unknown fiscal impact": {"fiscalImpact": "free"},
            "unknown district impact": {"districtImpact": "everywhere"},
            "priority not a boolean": {"mayorPriority": "maybe"},
            "specific without districts": {"districtImpact": "specific"},
            "specific with empty districts": {"districtImpact": "specific", "districts": []},
            "districts without specific": {"districtImpact": "citywide", "districts": ["District 1"]},
            "districts not a list": {"districtImpact": "specific", "districts": "District 1"},
            "committee too long": {"committee": "x" * 301},
        }
        with fake_claude() as create:
            for name, context in bad.items():
                with self.subTest(name):
                    response = self.post({"agenda": {**AGENDA, "context": context}, "members": ["dana-data"]})
                    self.assertEqual(response.status_code, 400, response.content)
                    self.assertIn("context", response.json()["details"]["agenda"])
        create.assert_not_called()
        self.assertFalse(SimulationRun.objects.exists())

    def test_agenda_errors_name_the_field(self):
        make_dossier(slug="dana-data")
        response = self.post({"agenda": {"title": "", "description": "x"}, "members": ["dana-data"]})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["details"]["agenda"]["title"], ["Add an agenda item with a title."])

    def test_more_members_than_seats(self):
        make_dossier()
        make_dossier()
        rules = {"bodySize": 1, "majorityThreshold": 1, "quorum": 1}
        with fake_claude():
            response = self.post({"agenda": AGENDA}, caller(vote_rules=rules))
        self.assertEqual(response.status_code, 400)
        self.assertIn("seats", response.content.decode())

    def test_more_members_than_seats_with_named_members(self):
        make_dossier(slug="dana-data")
        make_dossier()
        rules = {"bodySize": 1, "majorityThreshold": 1, "quorum": 1}
        with fake_claude() as create:
            response = self.post({"agenda": AGENDA, "members": ["dana-data"]}, caller(vote_rules=rules))
        self.assertEqual(response.status_code, 400)
        self.assertIn("seats", response.content.decode())
        create.assert_not_called()

    def test_member_without_slug_by_uuid(self):
        dossier = make_dossier()
        Member.objects.filter(pk=dossier.member_id).update(slug="")
        with fake_claude():
            response = self.post({"agenda": AGENDA, "members": [str(dossier.member_id).upper()]})
        self.assertEqual(response.status_code, 201, response.content)
        [answer] = response.json()["answers"]
        self.assertEqual((answer["memberSlug"], answer["memberId"]), ("", str(dossier.member_id)))

    def test_members_must_be_a_list_of_strings(self):
        make_dossier(slug="dana-data")
        for members in ("dana-data", [1], [""]):
            with self.subTest(members=members):
                self.assertEqual(self.post({"agenda": AGENDA, "members": members}).status_code, 400)

    def test_internal_errors_are_not_returned(self):
        make_dossier(slug="dana-data")
        with fake_claude() as create:
            create.side_effect = ValueError("password=hunter2 at db-internal:5432")
            with self.assertLogs("simulation.services", level="ERROR"):
                response = self.post({"agenda": AGENDA, "members": ["dana-data"]})
        self.assertEqual(response.status_code, 502)
        body = response.json()
        self.assertNotIn("hunter2", response.content.decode())
        self.assertEqual(body["error"], "The simulation failed because of a server error.")
        self.assertEqual(SimulationRun.objects.get(id=body["details"]["runId"]).error, body["error"])

    def test_needs_run_rehearsals(self):
        make_dossier(slug="dana-data")
        response = self.post({"agenda": AGENDA, "members": ["dana-data"]}, caller(runRehearsals=False))
        self.assertEqual(response.status_code, 403)

    def test_needs_login(self):
        response = self.client.post(reverse("simulation-create"), {"agenda": AGENDA}, format="json")
        self.assertEqual(response.status_code, 401)

    @override_settings(ANTHROPIC_API_KEY="")
    def test_no_api_key(self):
        make_dossier(slug="dana-data")
        response = self.post({"agenda": AGENDA, "members": ["dana-data"]})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["code"], "llm_not_configured")
        self.assertFalse(SimulationRun.objects.exists())


class SimulationDetailTests(APITestCase):
    def make_run(self, workspace_id):
        return SimulationRun.objects.create(
            workspace_id=workspace_id, run_by=uuid.uuid4(), agenda=AGENDA, status="done",
            answers=[{**CLAUDE_ANSWER, "memberSlug": "dana-data"}],
        )

    def get(self, run_id, user):
        self.client.force_authenticate(user=user)
        return self.client.get(reverse("simulation-detail", kwargs={"run_id": run_id}))

    def test_get_run(self):
        user = caller()
        run = self.make_run(user.workspace_id)
        response = self.get(run.id, user)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(run.id))
        self.assertEqual(response.json()["answers"][0]["levers"], CLAUDE_ANSWER["levers"])

    def test_unknown_or_other_workspace_is_404(self):
        other = self.make_run(OTHER_WORKSPACE_ID)
        for run_id in (uuid.uuid4(), other.id):
            with self.subTest(run_id=run_id):
                self.assertEqual(self.get(run_id, caller()).status_code, 404)

    def test_needs_view_results(self):
        user = caller(viewResults=False)
        run = self.make_run(user.workspace_id)
        self.assertEqual(self.get(run.id, user).status_code, 403)
