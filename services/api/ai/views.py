from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from ai.retrieval import find_evidence
from council.simulation_version import simulation_version
from council.views import WorkspaceDossierMixin


class EvidenceSearchView(WorkspaceDossierMixin, generics.GenericAPIView):
    """The member's dossier pieces closest to `q`, best first.

    ?q=...         the agenda text (required, up to 2000 characters)
    ?version=n     search that version; by default the one the simulator reads (latest approved, else current)

    Needs viewDossiers. A dossier from another workspace is 404 (WorkspaceDossierMixin)."""

    def get(self, request, *args, **kwargs):
        agenda_text = request.query_params.get("q", "").strip()
        if not agenda_text:
            raise ValidationError({"q": "Enter the agenda text to search for."})
        if len(agenda_text) > 2000:
            raise ValidationError({"q": "Keep it under 2000 characters."})

        version_no = self.version_no_from_query()
        if version_no is None:
            version = simulation_version(self.get_dossier()).version
        else:
            version = self.get_version(version_no)

        pieces = find_evidence(version, agenda_text)

        return Response({
            "member": version.name,
            "version": {"versionNo": version.version_no, "status": version.status},
            "agenda": agenda_text,
            "results": [
                {
                    "score": piece.score,
                    "kind": piece.kind,
                    "text": piece.text,
                    "sourceName": piece.source_name,
                    "sourceUrl": piece.source_url,
                }
                for piece in pieces
            ],
        })
