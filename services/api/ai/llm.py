import json
import anthropic
from django.conf import settings

STANCES = ["Strong Support", "Lean Support", "Undecided", "Lean Oppose", "Strong Oppose"]

ANSWER_SHAPE = {
    "type": "object",
    "properties": {
        "stance": {"type": "string", "enum": STANCES},
        "answer": {"type": "string"}, 
        "reasoning": {"type": "string"}, 
        "citations": {"type": "array", "items": {"type": "string"}}, 
    },
    "required": ["stance", "answer", "reasoning", "citations"],
    "additionalProperties": False,
}

INSTRUCTIONS = """You are simulating a city council member so that a team can rehearse pitching an agenda item.

Answer as this member would: their positions, their voting record, their style of speaking.
Use only the evidence given. Do not invent votes, quotes or facts. If the evidence says little about
this agenda item, say the member would be cautious, and choose "Undecided".

Return:
- stance: how the member would most likely vote.
- answer: 2 to 4 sentences, in the member's own voice, reacting to the pitch.
- reasoning: 1 to 3 sentences for the team: which evidence drives that stance.
- citations: the labels (E1, E2, ...) of the evidence you relied on. Only labels from the list."""


def ask_member(version, agenda, pieces):
    """One member's answer to one agenda item.

    version: the member's DossierVersion (who they are)
    agenda:  dict from the frontend, e.g. {"title": ..., "description": ..., "category": ..., "ask": ...}
    pieces:  the DossierEmbedding rows found by find_evidence()
    Returns {"stance", "answer", "reasoning", "citations": [{"label", "kind", "text", "sourceName", "sourceUrl"}]}."""

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

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=settings.LLM_MODEL,
        max_tokens=4000,
        system=INSTRUCTIONS,
        messages=[{"role": "user", "content": question}],
        output_config={
            "effort": settings.LLM_EFFORT,
            "format": {"type": "json_schema", "schema": ANSWER_SHAPE},
        },
    )
    if response.stop_reason in ("refusal", "max_tokens"):
        raise RuntimeError(f"Claude did not finish the answer ({response.stop_reason}).")

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
        for label in result["citations"]
        if label in labelled
    ]
    return result
