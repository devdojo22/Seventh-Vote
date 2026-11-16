"""Review workflow: every transition in council.review, for each kind of caller.

Callers are AuthenticatedPrincipal objects passed to force_authenticate, with the permissions the auth
service's permissionsFor() gives each of them, so no request reaches the auth service."""

import uuid

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.authentication import AuthenticatedPrincipal
from council import review, services
from council.models import Dossier, DossierVersion, ReviewStatus, ReviewStatusChange

WORKSPACE_ID = str(uuid.uuid4())
DRAFT, IN_REVIEW, APPROVED = ReviewStatus.DRAFT, ReviewStatus.IN_REVIEW, ReviewStatus.APPROVED


def _permissions(*, edit: bool, approve: bool, everything: bool = False) -> dict[str, bool]:
    return {
        "manageMembers": everything,
        "configureWorkspace": everything,
        "viewDossiers": True,
        "editDossiers": edit,
        "approveDossiers": approve,
        "runRehearsals": True,
        "viewResults": True,
    }


def _principal(*, role: str | None, permissions: dict[str, bool], is_super_admin: bool = False):
    return AuthenticatedPrincipal(
        user_id=str(uuid.uuid4()),
        is_super_admin=is_super_admin,
        workspace_id=WORKSPACE_ID,
        role=role,
        permissions=permissions,
    )


SUPER_ADMIN = _principal(
    role=None, permissions=_permissions(edit=True, approve=True, everything=True), is_super_admin=True
)
PRINCIPAL = _principal(role="PRINCIPAL", permissions=_permissions(edit=True, approve=True, everything=True))
AFFILIATE_EDIT = _principal(role="AFFILIATE", permissions=_permissions(edit=True, approve=False))
AFFILIATE_EDIT_APPROVE = _principal(role="AFFILIATE", permissions=_permissions(edit=True, approve=True))
AFFILIATE_VIEW = _principal(role="AFFILIATE", permissions=_permissions(edit=False, approve=False))

PERSONAS = {
    "super_admin": SUPER_ADMIN,
    "principal": PRINCIPAL,
    "affiliate_edit": AFFILIATE_EDIT,
    "affiliate_edit_approve": AFFILIATE_EDIT_APPROVE,
    "affiliate_view": AFFILIATE_VIEW,
}
APPROVERS = {"super_admin", "principal", "affiliate_edit_approve"}
EDITORS = APPROVERS | {"affiliate_edit"}

# Saves the dossiers and submits them for review on behalf of others, so it is never the caller under test.
AUTHOR = _principal(role="AFFILIATE", permissions=_permissions(edit=True, approve=False))


class ReviewWorkflowTests(APITestCase):
    def make_dossier(self, *, author=AUTHOR, status_=DRAFT, submitter=AUTHOR) -> Dossier:
        dossier = services.create_dossier(
            workspace_id=WORKSPACE_ID,
            user_id=author.user_id,
            member_data={},
            content={"name": f"Member {uuid.uuid4().hex[:8]}"},
            change_note="",
        )
        if status_ in (IN_REVIEW, APPROVED):
            review.change_status(version=dossier.current_version, to_status=IN_REVIEW, principal=submitter)
        if status_ == APPROVED:
            review.change_status(version=dossier.current_version, to_status=APPROVED, principal=PRINCIPAL)
        dossier.refresh_from_db()
        return dossier

    def post_review(self, caller, dossier: Dossier, to_status: str, *, version_no: int | None = None, note=None):
        self.client.force_authenticate(user=caller)
        body = {"status": to_status, "versionNo": version_no or dossier.current_version.version_no}
        if note is not None:
            body["note"] = note
        return self.client.post(reverse("dossier-review", kwargs={"ref": str(dossier.id)}), body, format="json")

    def current_status(self, dossier: Dossier) -> str:
        return DossierVersion.objects.get(pk=dossier.current_version_id).status

    def assert_changed(self, response, dossier: Dossier, to_status: str):
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(self.current_status(dossier), to_status)

    def assert_refused(self, response, dossier: Dossier, unchanged: str, *, code="status_not_allowed"):
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT, response.content)
        self.assertEqual(response.json()["code"], code)
        self.assertEqual(self.current_status(dossier), unchanged)

    def assert_forbidden(self, response, dossier: Dossier, unchanged: str):
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.content)
        self.assertEqual(self.current_status(dossier), unchanged)

    # --- 1. draft -> in_review ---------------------------------------------------------------------------

    def test_submit_for_review(self):
        for name, caller in PERSONAS.items():
            with self.subTest(caller=name):
                dossier = self.make_dossier()
                response = self.post_review(caller, dossier, IN_REVIEW)
                if name in EDITORS:
                    self.assert_changed(response, dossier, IN_REVIEW)
                    self.assertEqual(response.json()["changedBy"], caller.user_id)
                else:
                    self.assert_forbidden(response, dossier, DRAFT)

    # --- 2 & 9. in_review -> draft by withdrawal ---------------------------------------------------------

    def test_submitter_can_withdraw(self):
        for name in EDITORS:
            caller = PERSONAS[name]
            with self.subTest(caller=name):
                dossier = self.make_dossier(status_=IN_REVIEW, submitter=caller)
                response = self.post_review(caller, dossier, DRAFT)
                self.assert_changed(response, dossier, DRAFT)
                self.assertEqual(response.json()["note"], "")

    def test_only_the_submitter_can_withdraw(self):
        dossier = self.make_dossier(status_=IN_REVIEW, submitter=AUTHOR)
        response = self.post_review(AFFILIATE_EDIT, dossier, DRAFT)
        self.assert_refused(response, dossier, IN_REVIEW)
        self.assertIn("submitted", response.json()["error"])

    def test_view_only_affiliate_cannot_withdraw(self):
        dossier = self.make_dossier(status_=IN_REVIEW)
        self.assert_forbidden(self.post_review(AFFILIATE_VIEW, dossier, DRAFT), dossier, IN_REVIEW)

    # --- 3, 10 & 11. in_review -> draft by sending back --------------------------------------------------

    def test_send_back_with_note(self):
        for name, caller in PERSONAS.items():
            with self.subTest(caller=name):
                dossier = self.make_dossier(status_=IN_REVIEW, submitter=AUTHOR)
                response = self.post_review(caller, dossier, DRAFT, note="  Sources missing for the 2023 votes.  ")
                if name in APPROVERS:
                    self.assert_changed(response, dossier, DRAFT)
                    change = ReviewStatusChange.objects.get(pk=response.json()["id"])
                    self.assertEqual(change.note, "Sources missing for the 2023 votes.")
                elif name in EDITORS:
                    self.assert_refused(response, dossier, IN_REVIEW)
                else:
                    self.assert_forbidden(response, dossier, IN_REVIEW)

    def test_send_back_requires_a_note(self):
        for note in (None, "", "   "):
            with self.subTest(note=note):
                dossier = self.make_dossier(status_=IN_REVIEW, submitter=AUTHOR)
                response = self.post_review(PRINCIPAL, dossier, DRAFT, note=note)
                self.assert_refused(response, dossier, IN_REVIEW)
                self.assertIn("note", response.json()["error"])

    def test_send_back_note_is_shown_in_review_history(self):
        dossier = self.make_dossier(status_=IN_REVIEW, submitter=AUTHOR)
        self.post_review(PRINCIPAL, dossier, DRAFT, note="Needs a second source.")
        self.client.force_authenticate(user=AFFILIATE_VIEW)
        history = self.client.get(reverse("dossier-review-history", kwargs={"ref": str(dossier.id)})).json()
        self.assertEqual(history[0]["note"], "Needs a second source.")
        self.assertEqual(history[0]["toStatus"], DRAFT)
        self.assertIs(history[0]["selfApproved"], False)

    # --- 4, 5, 7 & 8. approval ---------------------------------------------------------------------------

    def test_approve_from_in_review(self):
        for name, caller in PERSONAS.items():
            with self.subTest(caller=name):
                dossier = self.make_dossier(status_=IN_REVIEW)
                response = self.post_review(caller, dossier, APPROVED)
                if name in APPROVERS:
                    self.assert_changed(response, dossier, APPROVED)
                elif name in EDITORS:
                    self.assert_refused(response, dossier, IN_REVIEW)
                    self.assertIn("approve", response.json()["error"])
                else:
                    self.assert_forbidden(response, dossier, IN_REVIEW)

    def test_approve_directly_from_draft(self):
        for name, caller in PERSONAS.items():
            with self.subTest(caller=name):
                dossier = self.make_dossier()
                response = self.post_review(caller, dossier, APPROVED)
                if name in APPROVERS:
                    self.assert_changed(response, dossier, APPROVED)
                elif name in EDITORS:
                    self.assert_refused(response, dossier, DRAFT)
                else:
                    self.assert_forbidden(response, dossier, DRAFT)

    # --- 6. approved is final ----------------------------------------------------------------------------

    def test_approved_version_cannot_change_status(self):
        for name, caller in PERSONAS.items():
            for to_status in (DRAFT, IN_REVIEW):
                with self.subTest(caller=name, to_status=to_status):
                    dossier = self.make_dossier(status_=APPROVED)
                    response = self.post_review(caller, dossier, to_status, note="Reopening.")
                    if name in EDITORS:
                        self.assert_refused(response, dossier, APPROVED)
                    else:
                        self.assert_forbidden(response, dossier, APPROVED)

    def test_editing_an_approved_dossier_saves_a_new_draft(self):
        dossier = self.make_dossier(status_=APPROVED)
        approved = dossier.current_version
        saved = services.save_dossier(
            dossier=dossier,
            user_id=AFFILIATE_EDIT.user_id,
            base_version_no=approved.version_no,
            member_data={},
            content={"name": approved.name, "profile": "Updated."},
            change_note="Update",
        )
        self.assertEqual(saved.current_version.version_no, approved.version_no + 1)
        self.assertEqual(saved.current_version.status, DRAFT)
        approved.refresh_from_db()
        self.assertEqual(approved.status, APPROVED)

    def test_same_status_is_unchanged(self):
        dossier = self.make_dossier()
        self.assert_refused(self.post_review(PRINCIPAL, dossier, DRAFT), dossier, DRAFT, code="status_unchanged")

    # --- 12. self-approval -------------------------------------------------------------------------------

    def test_self_approved_when_the_approver_saved_the_version(self):
        for name in APPROVERS:
            caller = PERSONAS[name]
            for from_status in (DRAFT, IN_REVIEW):
                with self.subTest(caller=name, from_status=from_status):
                    dossier = self.make_dossier(author=caller, status_=from_status)
                    response = self.post_review(caller, dossier, APPROVED)
                    self.assert_changed(response, dossier, APPROVED)
                    self.assertIs(response.json()["selfApproved"], True)
                    self.assertIs(ReviewStatusChange.objects.get(pk=response.json()["id"]).self_approved, True)

    def test_not_self_approved_when_someone_else_saved_the_version(self):
        dossier = self.make_dossier(author=AUTHOR, status_=IN_REVIEW)
        response = self.post_review(AFFILIATE_EDIT_APPROVE, dossier, APPROVED)
        self.assert_changed(response, dossier, APPROVED)
        self.assertIs(response.json()["selfApproved"], False)
        self.assertIs(ReviewStatusChange.objects.get(pk=response.json()["id"]).self_approved, False)

    def test_only_approvals_are_marked_self_approved(self):
        dossier = self.make_dossier(author=PRINCIPAL)
        response = self.post_review(PRINCIPAL, dossier, IN_REVIEW)
        self.assertIs(response.json()["selfApproved"], False)

    # --- 13. outdated version ----------------------------------------------------------------------------

    def test_reviewing_an_older_version_is_refused(self):
        dossier = self.make_dossier()
        services.save_dossier(
            dossier=dossier,
            user_id=AUTHOR.user_id,
            base_version_no=1,
            member_data={},
            content={"name": dossier.current_version.name},
            change_note="",
        )
        dossier.refresh_from_db()
        response = self.post_review(PRINCIPAL, dossier, APPROVED, version_no=1)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT, response.content)
        self.assertEqual(response.json()["code"], "version_conflict")
        self.assertEqual(response.json()["details"], {"currentVersionNo": 2})
        self.assertEqual(DossierVersion.objects.get(dossier=dossier, version_no=1).status, DRAFT)

    # --- 14. archived dossiers ---------------------------------------------------------------------------

    def test_archived_dossier_cannot_be_reviewed(self):
        for to_status in (IN_REVIEW, APPROVED):
            with self.subTest(to_status=to_status):
                dossier = self.make_dossier()
                services.archive_dossier(dossier, PRINCIPAL.user_id)
                response = self.post_review(PRINCIPAL, dossier, to_status)
                self.assert_refused(response, dossier, DRAFT, code="dossier_archived")

    # --- submitter in the version payload ----------------------------------------------------------------

    def test_version_detail_names_the_submitter_while_in_review(self):
        dossier = self.make_dossier(status_=IN_REVIEW, submitter=AFFILIATE_EDIT)
        self.client.force_authenticate(user=AFFILIATE_VIEW)
        detail = self.client.get(reverse("dossier-detail", kwargs={"ref": str(dossier.id)})).json()
        self.assertEqual(detail["currentVersion"]["submittedBy"], AFFILIATE_EDIT.user_id)

        self.post_review(AFFILIATE_EDIT, dossier, DRAFT)
        self.client.force_authenticate(user=AFFILIATE_VIEW)
        detail = self.client.get(reverse("dossier-detail", kwargs={"ref": str(dossier.id)})).json()
        self.assertIsNone(detail["currentVersion"]["submittedBy"])
