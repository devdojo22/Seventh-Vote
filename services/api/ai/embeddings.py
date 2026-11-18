import logging
from django.db import transaction
from fastembed import TextEmbedding
from ai.models import DossierEmbedding
from council.models import Dossier
from council.simulation_version import simulation_version

MODEL_NAME = "BAAI/bge-small-en-v1.5"

logger = logging.getLogger(__name__)


class DossierEmbedder:
    model = None

    def __init__(self):
        if DossierEmbedder.model is None:
            DossierEmbedder.model = TextEmbedding(MODEL_NAME, cache_dir="/models")

    def embed_texts(self, texts):
        """Dossier pieces -> one embedding (384 numbers) each."""
        return [vector.tolist() for vector in self.model.passage_embed(texts)]

    def embed_question(self, text):
        """A pitch or question -> one embedding, to compare with the dossier pieces."""
        return next(iter(self.model.query_embed(text))).tolist()

    def make_pieces(self, version):
        """Cuts a dossier version into small pieces: one per vote, quote, position, plus the profile texts.
        Each piece starts with the member's name, so its embedding knows whose it is."""
        who = f"{version.name} ({version.district})"
        pieces = []

        def add(kind, source_id, text, source_name="", source_url=""):
            if text and text.strip():
                pieces.append({
                    "kind": kind,
                    "source_id": str(source_id),
                    "text": f"{who}. {text.strip()}",
                    "source_name": source_name or "",
                    "source_url": source_url or "",
                })

        for record in version.key_records.all():
            add("key_record", record.lineage_id,
                f"{record.get_record_type_display()}: {record.title}. Outcome: {record.get_outcome_display()}. "
                f"{record.description} {record.date_text}",
                record.source_name, record.source_url)

        for quote in version.quotes.all():
            add("quote", quote.lineage_id, f'Quote: "{quote.text}" {quote.context}',
                quote.source_name, quote.source_url)

        for position in version.issue_positions:
            topic = position.get("topic", "")
            add("issue_position", topic, f"Position on {topic}: {position.get('stance', '')} {position.get('evidence', '')}",
                position.get("sourceName", ""), position.get("sourceUrl", ""))

        add("profile", "", f"Profile: {version.profile}")
        add("political_style", "", f"Political style: {version.political_archetype}. {version.political_style}")
        add("voting_bloc", "", f"Voting bloc: {version.voting_bloc}")

        return pieces

    @transaction.atomic
    def embed_version(self, version):
        """Makes the pieces of one version, embeds them and saves them. Old rows of this version are
        deleted first, so running it again is safe. Returns how many pieces were saved."""
        pieces = self.make_pieces(version)
        vectors = self.embed_texts([piece["text"] for piece in pieces])

        DossierEmbedding.objects.filter(dossier_version=version).delete()
        DossierEmbedding.objects.bulk_create([
            DossierEmbedding(
                workspace_id=version.dossier.workspace_id,
                member_id=version.dossier.member_id,
                dossier_version=version,
                embedding=vector,
                **piece,
            )
            for piece, vector in zip(pieces, vectors)
        ])
        return len(pieces)

    def embed_all_members(self):
        """Embeds, for every member, the version the simulator reads (latest approved, else current)."""
        for dossier in Dossier.objects.select_related("member").filter(member__archived_at__isnull=True): 
            version = simulation_version(dossier).version
            count = self.embed_version(version)
            print(f"{version.name} v{version.version_no}: {count} pieces")


def embed_after_approve(version):
    """Called when a dossier version is approved: embeds it once the approval is saved.
    If embedding fails, the approval still stands; the error is logged, and the version gets embedded
    the first time it is searched (see ai.retrieval.find_evidence)."""

    def run():
        try:
            DossierEmbedder().embed_version(version)
        except Exception:
            logger.exception("Embedding dossier version %s failed", version.pk)

    transaction.on_commit(run)
