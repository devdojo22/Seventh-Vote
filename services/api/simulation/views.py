import uuid

from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import HasWorkspacePermission
from council.models import Dossier
from simulation.errors import LlmNotConfigured, SimulationFailed
from simulation.models import SimulationRun
from simulation.serializers import AgendaSerializer
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


def _is_uuid(ref):
    try:
        uuid.UUID(ref)
    except ValueError:
        return False
    return True


def _member_ref(ref):
    """A `members` entry as the frontend names members: the slug, or the member's UUID when it has none."""
    return str(uuid.UUID(ref)) if _is_uuid(ref) else ref


def _member_refs(value):
    """The optional `members` list; None (or empty) means the whole council."""
    if value is None:
        return None
    if not isinstance(value, list) or not all(isinstance(ref, str) and ref for ref in value):
        raise ValidationError({"members": "Must be a list of member slugs."})
    return [_member_ref(ref) for ref in value]


class SimulationCreateView(APIView):
    """POST /api/simulations

    {
      "agenda": {"title": "...", "description": "...", "category": "...", "ask": "Approval",
                 "context": {...}},   // optional item details, see simulation.serializers
      "members": ["jerri-green"]      // optional: member slugs (UUIDs for members without one);
    }                                 // leave out for the whole council

    Needs runRehearsals. Returns the saved run (201) when every member answered.
    Errors use the standard body: 502 simulation_failed (details.runId), 503 llm_not_configured."""

    permission_classes = [HasWorkspacePermission.of("runRehearsals")]

    def post(self, request):
        if not settings.ANTHROPIC_API_KEY:
            raise LlmNotConfigured()

        agenda_input = AgendaSerializer(data=request.data.get("agenda"))
        if not agenda_input.is_valid():
            raise ValidationError({"agenda": agenda_input.errors})
        agenda = agenda_input.validated_data
        refs = _member_refs(request.data.get("members"))
        active = Dossier.objects.select_related("member").filter(
            workspace_id=request.user.workspace_id, member__archived_at__isnull=True
        )

        # Checked on every run, not only whole-council ones: a session that names its present members is still
        # counted against the seats (the absent ones are the active members it leaves out).
        vote_rules = request.user.vote_rules
        active_count = active.count()
        if vote_rules and active_count > vote_rules["bodySize"]:
            raise ValidationError({
                "members": f"This workspace has {active_count} active members but {vote_rules['bodySize']} voting "
                "seats. Archive members or update the body size in Workspace settings."
            })

        dossiers = active
        if refs:
            slugs = [ref for ref in refs if not _is_uuid(ref)]
            ids = [ref for ref in refs if _is_uuid(ref)]
            dossiers = list(active.filter(Q(member__slug__in=slugs) | Q(member_id__in=ids)))
            found = {d.member.slug for d in dossiers} | {str(d.member_id) for d in dossiers}
            missing = set(refs) - found
            if missing:
                raise ValidationError({"members": f"Not found in this workspace: {', '.join(sorted(missing))}"})
        dossiers = list(dossiers)
        if not dossiers:
            raise ValidationError({"members": "This workspace has no members to simulate."})

        run = run_simulation(
            workspace_id=request.user.workspace_id,
            user_id=request.user.user_id,
            agenda=agenda,
            dossiers=dossiers,
            vote_rules=vote_rules,
        )
        if run.status != SimulationRun.Status.DONE:
            raise SimulationFailed(run)
        return Response(run_to_json(run), status=status.HTTP_201_CREATED)


class SimulationDetailView(APIView):
    """GET /api/simulations/{id}: a saved run of this workspace. Needs viewResults."""

    permission_classes = [HasWorkspacePermission.of("viewResults")]

    def get(self, request, run_id):
        run = get_object_or_404(SimulationRun, id=run_id, workspace_id=request.user.workspace_id)
        return Response(run_to_json(run))
