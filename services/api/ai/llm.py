import json
import threading
import time
import anthropic
from django.conf import settings

STANCES = ["Strong Support", "Lean Support", "Undecided", "Lean Oppose", "Strong Oppose"]
CONFIDENCES = ["High", "Medium", "Low"]  
LIST_OF_TEXT = {"type": "array", "items": {"type": "string"}}

ANSWER_SHAPE = {
    "type": "object",
    "properties": {
        "stance": {"type": "string", "enum": STANCES},
        "confidence": {"type": "string", "enum": CONFIDENCES},  
        "answer": {"type": "string"},
        "reasoning": {"type": "string"},
        "concerns": LIST_OF_TEXT,  
        "levers": LIST_OF_TEXT,  
        "questions": LIST_OF_TEXT, 
        "citations": LIST_OF_TEXT,
    },
    "required": ["stance", "confidence", "answer", "reasoning", "concerns", "levers", "questions", "citations"],
    "additionalProperties": False,
}

INSTRUCTIONS = """You are simulating a city council member so that a team can rehearse pitching an agenda item.

Answer as this member would: their positions, their voting record, their style of speaking.
Use only the evidence given. Do not invent votes, quotes or facts. If the evidence says little about
this agenda item, say the member would be cautious, and choose "Undecided".

Return:
- stance: how the member would most likely vote.
- confidence: High if the evidence speaks directly to this item, Medium if it is related, Low if it is thin.
- answer: 2 to 4 sentences, in the member's own voice, reacting to the pitch.
- reasoning: 1 to 3 sentences for the team: which evidence drives that stance.
- concerns: up to 3 short points the member would likely push back on.
- levers: up to 3 short points that could move the member toward the team's ask.
- questions: up to 3 questions the member would likely ask the team.
- citations: the labels (E1, E2, ...) of the evidence you relied on. Only labels from the list.

Concerns, levers and questions must come from the evidence. Use an empty list rather than guessing.

When a Context section is given, weigh it against the evidence: for example the member's record on spending
when the item costs money, on the mayor when it is the mayor's priority, or on their own district when it is
affected. The context describes the item; it is not evidence about the member, so do not cite it."""

FISCAL_IMPACTS = {
    "cost": "Costs the city money",
    "neutral": "Revenue-neutral",
    "revenue": "Generates revenue or savings",
}
DISTRICT_IMPACTS = {
    "citywide": "Citywide",
    "specific": "Specific seat(s)",
    "super": "Super districts",
}
NOT_ENTERED = "not entered"

CONNECT_TIMEOUT_SECONDS = 15.0
MAX_ATTEMPTS = 3
RETRYABLE_STATUSES = {408, 409, 429}


class SimulationProblem(RuntimeError):
    """A failure whose message is safe to show the caller (it is saved as the run's error)."""


_client = None
_client_lock = threading.Lock()


def get_client():
    """One shared Anthropic client, reusing connections. Locked because a simulation's first calls come from
    several threads at once. The SDK's own retries are off: create_message() retries within the deadline."""
    global _client
    with _client_lock:
        if _client is None:
            _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY, max_retries=0)
        return _client


def _retryable(error):
    if isinstance(error, anthropic.APIStatusError):
        return error.status_code in RETRYABLE_STATUSES or error.status_code >= 500
    return isinstance(error, anthropic.APIConnectionError)  # includes APITimeoutError


def create_message(deadline, **request):
    """messages.create(), retried on transient errors, with every attempt (and the waits between them) ending
    by `deadline` (a time.monotonic() value). The SDK's retries can't be used for this: each of its attempts
    gets the full timeout again, so a slow answer could outlive the request."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise SimulationProblem("Claude took too long to answer.")
        timeout = anthropic.Timeout(remaining, connect=min(CONNECT_TIMEOUT_SECONDS, remaining))
        try:
            return get_client().messages.create(**request, timeout=timeout)
        except (anthropic.APIStatusError, anthropic.APIConnectionError) as error:
            delay = 2 ** (attempt - 1)  # 1s, then 2s
            if attempt == MAX_ATTEMPTS or not _retryable(error) or time.monotonic() + delay >= deadline:
                raise
            time.sleep(delay)
    raise AssertionError("unreachable")


def failure_reason(error):
    """The run's saved (and returned) error for `error`: never the raw exception text, which can hold Anthropic
    response bodies, database errors or server configuration. The full error goes to the log instead."""
    if isinstance(error, SimulationProblem):
        return str(error)
    if isinstance(error, anthropic.APITimeoutError):
        return "Claude took too long to answer."
    if isinstance(error, anthropic.RateLimitError):
        return "The AI service is busy (rate limited)."
    if isinstance(error, anthropic.APIStatusError):
        return f"The AI service returned an error (HTTP {error.status_code})."
    if isinstance(error, anthropic.APIConnectionError):
        return "The AI service could not be reached."
    return "The simulation failed because of a server error."


def context_lines(context):
    """The agenda's `context` (validated by simulation.serializers.AgendaSerializer) as prompt lines."""
    if not context:
        return []
    lines = []
    if "actionType" in context:
        lines.append(f"- Action type: {context['actionType'] or NOT_ENTERED}")
    if "fiscalImpact" in context:
        lines.append(f"- Fiscal impact: {FISCAL_IMPACTS[context['fiscalImpact']]}")
    if "mayorPriority" in context:
        lines.append(f"- Mayor's priority: {'Yes' if context['mayorPriority'] else 'No'}")
    if "districtImpact" in context:
        impact = DISTRICT_IMPACTS[context["districtImpact"]]
        if context["districtImpact"] == "specific":
            impact = f"{impact}: {', '.join(context.get('districts', []))}"
        lines.append(f"- District impact: {impact}")
    if "committee" in context:
        lines.append(f"- Committee referral: {context['committee'] or NOT_ENTERED}")
    if "committeeChair" in context:
        lines.append(f"- Committee chair: {context['committeeChair'] or NOT_ENTERED}")
    return lines


def ask_member(version, agenda, pieces, *, deadline=None):
    """One member's answer to one agenda item.

    version:  the member's DossierVersion (who they are)
    agenda:   the validated agenda: {"title", "description", "category"?, "ask"?, "context"?}
    pieces:   the DossierEmbedding rows found by find_evidence()
    deadline: time.monotonic() by which the answer must be in; SIMULATION_TIMEOUT_SECONDS from now if None
    Returns {"stance", "confidence", "answer", "reasoning", "concerns", "levers", "questions",
             "citations": [{"label", "kind", "text", "sourceName", "sourceUrl"}]}."""

    labelled = {f"E{number}": piece for number, piece in enumerate(pieces, start=1)}
    evidence_text = "\n".join(f"[{label}] {piece.text}" for label, piece in labelled.items())

    question = (
        f"Council member: {version.name} ({version.district})\n"
        f"Political style: {version.political_style or 'unknown'}\n\n"
        f"Evidence:\n{evidence_text or '(no evidence found)'}\n\n"
        f"Agenda item: {agenda.get('title', '')}\n"
        f"Description: {agenda.get('description', '')}\n"
        f"What is being asked: {agenda.get('ask', '')}"
    )
    context = context_lines(agenda.get("context"))
    if context:
        question += "\n\nContext:\n" + "\n".join(context)

    if deadline is None:
        deadline = time.monotonic() + settings.SIMULATION_TIMEOUT_SECONDS
    response = create_message(
        deadline,
        model=settings.LLM_MODEL,
        max_tokens=settings.LLM_MAX_TOKENS,
        system=INSTRUCTIONS,
        messages=[{"role": "user", "content": question}],
        output_config={
            "effort": settings.LLM_EFFORT,
            "format": {"type": "json_schema", "schema": ANSWER_SHAPE},
        },
    )
    if response.stop_reason in ("refusal", "max_tokens"):
        raise SimulationProblem(f"Claude did not finish the answer ({response.stop_reason}).")

    text = next(block.text for block in response.content if block.type == "text")
    result = json.loads(text)
    result["citations"] = [
        {
            "label": label,
            "kind": labelled[label].kind,
            "text": labelled[label].text,
            "sourceName": labelled[label].source_name,
            "sourceUrl": labelled[label].source_url,
        }
        for label in dict.fromkeys(result["citations"])
        if label in labelled
    ]
    return result
