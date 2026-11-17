# M4/03: see the dossier embeddings in Django admin (read-only; the 384 numbers are hidden).

from django.contrib import admin

from ai.models import DossierEmbedding


@admin.register(DossierEmbedding)
class DossierEmbeddingAdmin(admin.ModelAdmin):
    list_display = ["member", "kind", "text", "source_name", "embedding_preview"]
    list_filter = ["kind"]
    search_fields = ["text"]
    exclude = ["embedding"]
    readonly_fields = ["embedding_preview"]

    @admin.display(description="Embedding")
    def embedding_preview(self, obj):
        """The first 4 of the 384 numbers, enough to see the vector is there."""
        numbers = list(obj.embedding)
        first = ", ".join(f"{n:.4f}" for n in numbers[:4])
        return f"[{first}, …] ({len(numbers)} numbers)"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
