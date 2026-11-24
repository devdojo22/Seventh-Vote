from django.conf import settings
from pgvector.django import CosineDistance
from ai.embeddings import DossierEmbedder
from ai.models import DossierEmbedding

def find_evidence(version, agenda_text, k=None, agenda_embedding=None):
    """The k pieces of this dossier version closest to the agenda text, best first; k defaults to
    settings.SIMULATION_EVIDENCE_COUNT. Each piece gets a `score`: 1 = same meaning, 0 = unrelated.
    Pass `agenda_embedding` (DossierEmbedder.embed_question of the same text) when searching several
    versions for one agenda, so the text is embedded once."""
    k = settings.SIMULATION_EVIDENCE_COUNT if k is None else k
    embedder = DossierEmbedder()
    if not DossierEmbedding.objects.filter(dossier_version=version).exists():
        embedder.embed_version(version)

    if agenda_embedding is None:
        agenda_embedding = embedder.embed_question(agenda_text)

    pieces = list(
        DossierEmbedding.objects
        .filter(dossier_version=version)
        .annotate(distance=CosineDistance("embedding", agenda_embedding))
        .order_by("distance")[:k]
    )

    for piece in pieces:
        piece.score = round(1 - piece.distance, 3)
    return pieces
