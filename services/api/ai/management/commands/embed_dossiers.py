from django.core.management.base import BaseCommand
from ai.embeddings import DossierEmbedder
from ai.models import DossierEmbedding


class Command(BaseCommand):
    help = "Embed every member's dossier for search."

    def handle(self, *args, **options):
        DossierEmbedder().embed_all_members()
        self.stdout.write(self.style.SUCCESS(f"Done. {DossierEmbedding.objects.count()} embeddings in the database."))
