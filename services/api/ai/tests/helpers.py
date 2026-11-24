"""Shared test helpers for M4: dossiers with real evidence, callers, and a fake Claude."""

import json
import uuid
from types import SimpleNamespace
from unittest import mock

from core.authentication import AuthenticatedPrincipal
from council import review, services
from council.models import ReviewStatus
from council.tests.test_review import PRINCIPAL, WORKSPACE_ID, _permissions

OTHER_WORKSPACE_ID = str(uuid.uuid4())

DATA_CENTER_MEMBER = {
    "name": "Dana Data",
    "district": "District 1",
    "profile": "Focused on utilities and the cost of power for residents.",
    "political_archetype": "Watchdog",
    "political_style": "Asks for numbers before voting.",
    "voting_bloc": "Reform bloc",
    "issue_positions": [
        {"topic": "Data centers", "stance": "Wants a pause on new data center permits.",
         "evidence": "Co-sponsored the moratorium draft.", "sourceName": "Council minutes",
         "sourceUrl": "https://example.com/minutes"},
    ],
    "key_records": [
        {"record_type": "sponsorship", "title": "Data center moratorium ordinance", "outcome": "support_signal",
         "description": "Co-sponsor of a 12-month pause on data center permits.", "date_text": "2025",
         "source_name": "Ordinance file", "source_url": "https://example.com/ordinance"},
        {"record_type": "vote", "title": "Library opening hours", "outcome": "yes",
         "description": "Voted to extend weekend library hours.", "date_text": "2024"},
    ],
    "quotes": [
        {"text": "We were kept in the dark on data centers.", "context": "Committee hearing",
         "source_name": "Hearing video", "source_url": "https://example.com/video"},
    ],
}


def make_dossier(content=None, *, workspace_id=WORKSPACE_ID, slug=None, approve=False):
    """A member with a dossier at version 1. approve=True takes it through review to approved."""
    content = dict(content or DATA_CENTER_MEMBER)
    content["name"] = content.get("name", "Member") + f" {uuid.uuid4().hex[:6]}"
    dossier = services.create_dossier(
        workspace_id=workspace_id,
        user_id=PRINCIPAL.user_id,
        member_data={"slug": slug} if slug else {},
        content=content,
        change_note="",
    )
    if approve:
        review.change_status(version=dossier.current_version, to_status=ReviewStatus.IN_REVIEW, principal=PRINCIPAL)
        review.change_status(version=dossier.current_version, to_status=ReviewStatus.APPROVED, principal=PRINCIPAL)
    dossier.refresh_from_db()
    return dossier


def caller(*, workspace_id=WORKSPACE_ID, vote_rules=None, **permissions):
    """A workspace user. Pass e.g. runRehearsals=False to take one permission away."""
    return AuthenticatedPrincipal(
        user_id=str(uuid.uuid4()),
        is_super_admin=False,
        workspace_id=workspace_id,
        role="PRINCIPAL",
        permissions={**_permissions(edit=True, approve=True, everything=True), **permissions},
        vote_rules=vote_rules,
    )


CLAUDE_ANSWER = {
    "stance": "Lean Support",
    "confidence": "Medium",
    "answer": "I want the power and water numbers first, but I lean yes.",
    "reasoning": "She co-sponsored the moratorium draft (E1).",
    "concerns": ["The pause must lead to real safeguards"],
    "levers": ["Bring the MLGW impact data"],
    "questions": ["Who runs the study during the 12 months?"],
    "citations": ["E1"],
}


def claude_reply(answer=None, stop_reason="end_turn"):
    """What anthropic's messages.create returns: one text block holding the JSON answer."""
    text = json.dumps(CLAUDE_ANSWER if answer is None else answer)
    return SimpleNamespace(stop_reason=stop_reason, content=[SimpleNamespace(type="text", text=text)])


def fake_claude(reply=None):
    """Patches the Anthropic client. Use as a context manager; the mock's messages.create is returned."""
    patcher = mock.patch("ai.llm.anthropic.Anthropic")
    # ai.llm keeps one shared client; start each fake with none, so the patched class is used.
    no_cached_client = mock.patch("ai.llm._client", None)

    class _Fake:
        def __enter__(self):
            no_cached_client.start()
            client_class = patcher.start()
            self.create = client_class.return_value.messages.create
            self.create.return_value = reply or claude_reply()
            return self.create

        def __exit__(self, *exc):
            patcher.stop()
            no_cached_client.stop()

    return _Fake()
