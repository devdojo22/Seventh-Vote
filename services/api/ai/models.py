import uuid
from django.db import models
from pgvector.django import VectorField
from council.models import DossierVersion, Member


class DossierEmbedding(models.Model):
    """One small piece of a member's dossier (a vote, a quote, a position...) and its embedding."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace_id = models.UUIDField()
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    dossier_version = models.ForeignKey(DossierVersion, on_delete=models.CASCADE)

    kind = models.CharField(max_length=30)  # key_record, quote, issue_position, profile...
    source_id = models.CharField(max_length=300, blank=True)  # which item it came from
    text = models.TextField()  # the text that was embedded

    source_name = models.CharField(max_length=300, blank=True)
    source_url = models.URLField(max_length=2000, blank=True)

    embedding = VectorField(dimensions=384)  # BAAI/bge-small-en-v1.5 gives 384 numbers

    class Meta:
        db_table = "dossier_embeddings"

    def __str__(self):
        return f"{self.kind}: {self.text[:60]}"
