from pgvector.django import CosineDistance
from ai.embeddings import DossierEmbedder
from ai.models import DossierEmbedding

def find_evidence(version, agenda_text, k=6):
    """The k pieces of this dossier version closest to the agenda text, best first.
    Each piece gets a `score`: 1 = same meaning, 0 = unrelated."""
    embedder = DossierEmbedder()
    if not DossierEmbedding.objects.filter(dossier_version=version).exists():
        embedder.embed_version(version)

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
