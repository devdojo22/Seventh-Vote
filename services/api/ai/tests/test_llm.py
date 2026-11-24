"""M4/04-05: ask_member() with a fake Claude. No network, no money."""

import time
from types import SimpleNamespace
from unittest import mock

import anthropic
from django.test import SimpleTestCase, override_settings

from ai.llm import (
    ANSWER_SHAPE,
    CONFIDENCES,
    CONNECT_TIMEOUT_SECONDS,
    DISTRICT_IMPACTS,
    FISCAL_IMPACTS,
    INSTRUCTIONS,
    MAX_ATTEMPTS,
    STANCES,
    SimulationProblem,
    ask_member,
    context_lines,
    failure_reason,
)
from ai.tests.helpers import CLAUDE_ANSWER, claude_reply, fake_claude

VERSION = SimpleNamespace(name="Dana Data", district="District 1", political_style="Asks for numbers.")
AGENDA = {"title": "Data center moratorium", "description": "A 12-month pause.", "ask": "Approval"}


def piece(kind, text, source_name="", source_url=""):
    return SimpleNamespace(kind=kind, text=text, source_name=source_name, source_url=source_url)


PIECES = [
    piece("key_record", "Co-sponsored the moratorium.", "Ordinance file", "https://example.com/ordinance"),
    piece("quote", "We were kept in the dark.", "Hearing video", "https://example.com/video"),
]


@override_settings(ANTHROPIC_API_KEY="test-key", LLM_MODEL="claude-opus-5-5", LLM_EFFORT="medium")
class AskMemberTests(SimpleTestCase):
    # --- the answer -------------------------------------------------------------------------------------

    def test_returns_every_field(self):
        with fake_claude():
            result = ask_member(VERSION, AGENDA, PIECES)
        self.assertEqual(
            set(result),
            {"stance", "confidence", "answer", "reasoning", "concerns", "levers", "questions", "citations"},
        )

    def test_stance_answer_and_reasoning_come_through(self):
        with fake_claude():
            result = ask_member(VERSION, AGENDA, PIECES)
        self.assertEqual(result["stance"], "Lean Support")
        self.assertEqual(result["answer"], CLAUDE_ANSWER["answer"])
        self.assertEqual(result["reasoning"], CLAUDE_ANSWER["reasoning"])

    def test_new_fields_come_through(self):
        with fake_claude():
            result = ask_member(VERSION, AGENDA, PIECES)
        self.assertEqual(result["confidence"], "Medium")
        self.assertEqual(result["concerns"], ["The pause must lead to real safeguards"])
        self.assertEqual(result["levers"], ["Bring the MLGW impact data"])
        self.assertEqual(result["questions"], ["Who runs the study during the 12 months?"])

    def test_empty_lists_are_kept(self):
        answer = {**CLAUDE_ANSWER, "concerns": [], "levers": [], "questions": [], "confidence": "Low"}
        with fake_claude(claude_reply(answer)):
            result = ask_member(VERSION, AGENDA, PIECES)
        self.assertEqual((result["concerns"], result["levers"], result["questions"]), ([], [], []))
        self.assertEqual(result["confidence"], "Low")

    # --- citations --------------------------------------------------------------------------------------

    def test_citation_labels_become_sources(self):
        with fake_claude(claude_reply({**CLAUDE_ANSWER, "citations": ["E1", "E2"]})):
            result = ask_member(VERSION, AGENDA, PIECES)
        self.assertEqual(result["citations"], [
            {"label": "E1", "kind": "key_record", "text": "Co-sponsored the moratorium.",
             "sourceName": "Ordinance file", "sourceUrl": "https://example.com/ordinance"},
            {"label": "E2", "kind": "quote", "text": "We were kept in the dark.",
             "sourceName": "Hearing video", "sourceUrl": "https://example.com/video"},
        ])

    def test_made_up_labels_are_dropped(self):
        with fake_claude(claude_reply({**CLAUDE_ANSWER, "citations": ["E1", "E9"]})):
            result = ask_member(VERSION, AGENDA, PIECES)
        self.assertEqual([c["label"] for c in result["citations"]], ["E1"])

    # --- what we send Claude ----------------------------------------------------------------------------

    def test_schema_requires_every_field(self):
        self.assertEqual(
            set(ANSWER_SHAPE["required"]),
            {"stance", "confidence", "answer", "reasoning", "concerns", "levers", "questions", "citations"},
        )
        self.assertFalse(ANSWER_SHAPE["additionalProperties"])

    def test_schema_limits_stance_and_confidence(self):
        props = ANSWER_SHAPE["properties"]
        self.assertEqual(props["stance"]["enum"], STANCES)
        self.assertEqual(props["confidence"]["enum"], CONFIDENCES)
        self.assertEqual(CONFIDENCES, ["High", "Medium", "Low"])
        for name in ("concerns", "levers", "questions", "citations"):
            self.assertEqual(props[name], {"type": "array", "items": {"type": "string"}}, name)

    def test_request_sent_to_claude(self):
        with fake_claude() as create:
            ask_member(VERSION, AGENDA, PIECES)
        kwargs = create.call_args.kwargs
        self.assertEqual(kwargs["model"], "claude-opus-5-5")
        self.assertEqual(kwargs["output_config"]["effort"], "medium")
        self.assertEqual(kwargs["output_config"]["format"], {"type": "json_schema", "schema": ANSWER_SHAPE})
        question = kwargs["messages"][0]["content"]
        for text in ("Dana Data", "District 1", "[E1] Co-sponsored the moratorium.", "[E2]",
                     "Data center moratorium", "A 12-month pause.", "Approval"):
            self.assertIn(text, question)
        for word in ("confidence", "concerns", "levers", "questions"):
            self.assertIn(word, kwargs["system"])

    def test_no_evidence(self):
        with fake_claude() as create:
            result = ask_member(VERSION, AGENDA, [])
        self.assertIn("(no evidence found)", create.call_args.kwargs["messages"][0]["content"])
        self.assertEqual(result["citations"], [])

    # --- M4/05: item context from the Session form -------------------------------------------------------

    def question_for(self, agenda):
        with fake_claude() as create:
            ask_member(VERSION, agenda, PIECES)
        return create.call_args.kwargs["messages"][0]["content"]

    def test_full_context_is_sent(self):
        context = {
            "actionType": "Ordinary ordinance",
            "fiscalImpact": "cost",
            "mayorPriority": True,
            "districtImpact": "specific",
            "districts": ["District 1", "District 4"],
            "committee": "Public Works",
            "committeeChair": "Dana Data",
        }
        question = self.question_for({**AGENDA, "context": context})
        self.assertIn(
            "Context:\n"
            "- Action type: Ordinary ordinance\n"
            "- Fiscal impact: Costs the city money\n"
            "- Mayor's priority: Yes\n"
            "- District impact: Specific seat(s): District 1, District 4\n"
            "- Committee referral: Public Works\n"
            "- Committee chair: Dana Data",
            question,
        )

    def test_every_choice_has_its_wording(self):
        for fiscal, text in FISCAL_IMPACTS.items():
            with self.subTest(fiscalImpact=fiscal):
                self.assertIn(f"- Fiscal impact: {text}", self.question_for({**AGENDA, "context": {"fiscalImpact": fiscal}}))
        for impact in ("citywide", "super"):
            with self.subTest(districtImpact=impact):
                question = self.question_for({**AGENDA, "context": {"districtImpact": impact}})
                self.assertIn(f"- District impact: {DISTRICT_IMPACTS[impact]}\n", question + "\n")
        self.assertIn("- Mayor's priority: No", self.question_for({**AGENDA, "context": {"mayorPriority": False}}))

    def test_blank_fields_say_not_entered(self):
        question = self.question_for({**AGENDA, "context": {"committee": "", "committeeChair": "", "actionType": ""}})
        for line in ("- Action type: not entered", "- Committee referral: not entered", "- Committee chair: not entered"):
            self.assertIn(line, question)

    def test_no_context_no_section(self):
        for agenda in (AGENDA, {**AGENDA, "context": {}}):
            with self.subTest(agenda=agenda):
                self.assertNotIn("Context:", self.question_for(agenda))

    def test_context_lines_only_for_given_fields(self):
        self.assertEqual(context_lines({"fiscalImpact": "neutral"}), ["- Fiscal impact: Revenue-neutral"])
        self.assertEqual(context_lines(None), [])

    def test_instructions_explain_context(self):
        self.assertIn("Context section", INSTRUCTIONS)
        self.assertIn("do not cite it", INSTRUCTIONS)

    # --- Claude does not finish -------------------------------------------------------------------------

    def test_refusal_and_cut_off_raise(self):
        for reason in ("refusal", "max_tokens"):
            with self.subTest(stop_reason=reason), fake_claude(claude_reply(stop_reason=reason)):
                with self.assertRaises(SimulationProblem) as raised:
                    ask_member(VERSION, AGENDA, PIECES)
                self.assertEqual(failure_reason(raised.exception), f"Claude did not finish the answer ({reason}).")

    # --- the deadline and retries -----------------------------------------------------------------------

    def test_each_call_ends_by_the_deadline(self):
        with fake_claude() as create:
            ask_member(VERSION, AGENDA, PIECES, deadline=time.monotonic() + 40)
        timeout = create.call_args.kwargs["timeout"]
        self.assertLessEqual(timeout.read, 40)
        self.assertLessEqual(timeout.connect, CONNECT_TIMEOUT_SECONDS)

    def test_past_deadline_does_not_call_claude(self):
        with fake_claude() as create, self.assertRaises(SimulationProblem):
            ask_member(VERSION, AGENDA, PIECES, deadline=time.monotonic() - 1)
        create.assert_not_called()

    def test_connection_errors_are_retried(self):
        with fake_claude() as create, mock.patch("ai.llm.time.sleep"):
            create.side_effect = [anthropic.APIConnectionError(request=mock.Mock()), claude_reply()]
            result = ask_member(VERSION, AGENDA, PIECES)
        self.assertEqual(result["stance"], "Lean Support")
        self.assertEqual(create.call_count, 2)

    def test_gives_up_after_the_last_attempt(self):
        with fake_claude() as create, mock.patch("ai.llm.time.sleep"):
            create.side_effect = anthropic.APIConnectionError(request=mock.Mock())
            with self.assertRaises(anthropic.APIConnectionError) as raised:
                ask_member(VERSION, AGENDA, PIECES)
        self.assertEqual(create.call_count, MAX_ATTEMPTS)
        self.assertEqual(failure_reason(raised.exception), "The AI service could not be reached.")

    def test_unexpected_errors_have_a_generic_reason(self):
        self.assertEqual(failure_reason(ValueError("db password")), "The simulation failed because of a server error.")
