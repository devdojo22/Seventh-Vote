from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import HasWorkspacePermission
from council.models import Dossier
from simulation.models import SimulationRun
from simulation.services import run_simulation


def run_to_json(run):
    return {
        "id": str(run.id),
        "status": run.status,
        "error": run.error,
        "agenda": run.agenda,
        "answers": run.answers,
        "voteRules": run.vote_rules,
        "createdAt": run.created_at,
    }


class SimulationCreateView(APIView):
    """POST /api/simulations

    {
      "agenda": {"title": "...", "description": "...", "category": "...", "ask": "Approval"},
      "members": ["jerri-green"]      // optional: member slugs; leave out for the whole council
    }

    Needs runRehearsals. Returns the saved run: 201 when every member answered, 502 when it failed."""

    permission_classes = [HasWorkspacePermission.of("runRehearsals")]

    def post(self, request):
        if not settings.ANTHROPIC_API_KEY:
            return Response({"detail": "Claude is not set up: ANTHROPIC_API_KEY is empty."}, status=503)

        agenda = request.data.get("agenda")
        if not isinstance(agenda, dict) or not str(agenda.get("title", "")).strip():
            raise ValidationError({"agenda": "Add an agenda item with a title."})
        if not str(agenda.get("description", "")).strip():
            raise ValidationError({"agenda": "Add a description of the agenda item."})
        dossiers = Dossier.objects.select_related("member").filter(
            workspace_id=request.user.workspace_id, member__archived_at__isnull=True
        )
        slugs = request.data.get("members")
        if slugs:
            dossiers = dossiers.filter(member__slug__in=slugs)
            missing = set(slugs) - {d.member.slug for d in dossiers}
            if missing:
                raise ValidationError({"members": f"Not found in this workspace: {', '.join(sorted(missing))}"})
        dossiers = list(dossiers)
        if not dossiers:
            raise ValidationError({"members": "This workspace has no members to simulate."})

        vote_rules = request.user.vote_rules
        if not slugs and vote_rules and len(dossiers) > vote_rules["bodySize"]:
            raise ValidationError({
                "members": f"This workspace has {len(dossiers)} active members but {vote_rules['bodySize']} voting "
                "seats. Archive members or update the body size in Workspace settings."
            })

        run = run_simulation(
            workspace_id=request.user.workspace_id,
            user_id=request.user.user_id,
            agenda=agenda,
            dossiers=dossiers,
            vote_rules=vote_rules,
        )
        code = status.HTTP_201_CREATED if run.status == SimulationRun.Status.DONE else status.HTTP_502_BAD_GATEWAY
        return Response(run_to_json(run), status=code)


class SimulationDetailView(APIView):
    """GET /api/simulations/{id}: a saved run of this workspace. Needs viewResults."""

    permission_classes = [HasWorkspacePermission.of("viewResults")]

    def get(self, request, run_id):
        run = get_object_or_404(SimulationRun, id=run_id, workspace_id=request.user.workspace_id)
        return Response(run_to_json(run))
