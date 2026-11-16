# M4/01: new file. Tests for the simulation version rule and GET /api/council.

"""Which version the simulator reads (council.simulation_version), and GET /api/council which serves it."""

import uuid

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from council import review, services
from council.models import Dossier, ReviewStatus
from council.simulation_version import Basis, council_versions, simulation_version
from council.tests.test_review import AUTHOR, PRINCIPAL, WORKSPACE_ID, _permissions, _principal

DRAFT, IN_REVIEW, APPROVED = ReviewStatus.DRAFT, ReviewStatus.IN_REVIEW, ReviewStatus.APPROVED


def make_dossier(name: str, *, workspace_id: str = WORKSPACE_ID) -> Dossier:
    return services.create_dossier(
        workspace_id=workspace_id,
        user_id=AUTHOR.user_id,
        member_data={},
        # Validated content, as the serializer hands it to the service: snake_case keys.
        content={
            "name": name,
            "key_records": [{"title": f"{name} record", "record_type": "vote"}],
            "quotes": [{"text": f"{name} quote"}],
        },
        change_note="",
    )


def approve(dossier: Dossier) -> None:
    dossier.refresh_from_db()
    review.change_status(version=dossier.current_version, to_status=APPROVED, principal=PRINCIPAL)


def save_new_draft(dossier: Dossier, name: str) -> None:
    dossier.refresh_from_db()
    services.save_dossier(
        dossier=dossier,
        user_id=AUTHOR.user_id,
        base_version_no=dossier.current_version.version_no,
        member_data={},
        content={"name": name},
        change_note="",
    )


class SimulationVersionRuleTests(APITestCase):
    def picked(self, dossier: Dossier) -> tuple[int, Basis]:
        dossier.refresh_from_db()
        single = simulation_version(dossier)
        (batched,) = [sv for sv in council_versions(WORKSPACE_ID) if sv.dossier.pk == dossier.pk]
        # Both entry points must apply the same rule.
        self.assertEqual((single.version.pk, single.basis), (batched.version.pk, batched.basis))
        return single.version.version_no, single.basis

    def test_approved_version_is_used(self):
        dossier = make_dossier("Approved Member")
        approve(dossier)
        self.assertEqual(self.picked(dossier), (1, Basis.APPROVED))

    def test_without_an_approved_version_the_current_one_is_used_and_flagged(self):
        dossier = make_dossier("Draft Member")
        save_new_draft(dossier, "Draft Member")
        self.assertEqual(self.picked(dossier), (2, Basis.UNREVIEWED))

    def test_in_review_counts_as_unreviewed(self):
        dossier = make_dossier("In Review Member")
        review.change_status(version=dossier.current_version, to_status=IN_REVIEW, principal=AUTHOR)
        self.assertEqual(self.picked(dossier), (1, Basis.UNREVIEWED))

    def test_a_new_draft_does_not_replace_the_approved_version(self):
        dossier = make_dossier("Edited Member")
        approve(dossier)
        save_new_draft(dossier, "Edited Member")
        save_new_draft(dossier, "Edited Member")
        self.assertEqual(self.picked(dossier), (1, Basis.APPROVED))

    def test_approving_a_newer_version_switches_to_it(self):
        dossier = make_dossier("Reapproved Member")
        approve(dossier)
        save_new_draft(dossier, "Reapproved Member")
        approve(dossier)
        self.assertEqual(self.picked(dossier), (2, Basis.APPROVED))


class CouncilEndpointTests(APITestCase):
    url = reverse("council")

    def get(self, caller=None):
        self.client.force_authenticate(user=caller or AUTHOR)
        return self.client.get(self.url)

    def test_returns_the_simulation_version_not_the_newest(self):
        dossier = make_dossier("Jerri Green")
        approve(dossier)
        save_new_draft(dossier, "Jerri Green")

        response = self.get()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        (entry,) = response.data
        self.assertEqual(entry["id"], str(dossier.pk))
        self.assertEqual(entry["basis"], "approved")
        self.assertEqual(entry["version"]["versionNo"], 1)
        self.assertEqual(entry["version"]["status"], APPROVED)
        self.assertEqual(entry["version"]["keyRecords"][0]["title"], "Jerri Green record")

    def test_unreviewed_members_stay_in_the_council(self):
        approve(make_dossier("Approved Member"))
        make_dossier("Draft Member")

        bases = {e["member"]["name"]: e["basis"] for e in self.get().data}

        self.assertEqual(bases, {"Approved Member": "approved", "Draft Member": "unreviewed"})

    def test_member_count_follows_the_workspace(self):
        for i in range(5):
            make_dossier(f"Member {i}")
        self.assertEqual(len(self.get().data), 5)

    def test_leaves_out_archived_members_and_other_workspaces(self):
        make_dossier("Active Member")
        services.archive_dossier(make_dossier("Archived Member"), AUTHOR.user_id)
        make_dossier("Elsewhere Member", workspace_id=str(uuid.uuid4()))

        names = [e["member"]["name"] for e in self.get().data]

        self.assertEqual(names, ["Active Member"])

    def test_needs_view_permission(self):
        no_view = _principal(role="AFFILIATE", permissions={**_permissions(edit=False, approve=False), "viewDossiers": False})
        self.assertEqual(self.get(no_view).status_code, status.HTTP_403_FORBIDDEN)

    def test_query_count_does_not_grow_with_members(self):
        def count() -> int:
            with CaptureQueriesContext(connection) as queries:
                self.assertEqual(self.get().status_code, status.HTTP_200_OK)
            return len(queries)

        approve(make_dossier("First"))
        make_dossier("Second")
        few = count()
        for i in range(4):
            approve(make_dossier(f"More {i}"))
            make_dossier(f"Draft {i}")
        self.assertEqual(count(), few)
