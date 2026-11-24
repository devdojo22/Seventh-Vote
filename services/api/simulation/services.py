import logging
import time
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from ai.embeddings import DossierEmbedder
from ai.llm import ask_member, failure_reason
from ai.retrieval import find_evidence
from council.simulation_version import simulation_version
from simulation.models import SimulationRun

logger = logging.getLogger(__name__)


def run_simulation(*, workspace_id, user_id, agenda, dossiers, vote_rules=None):
    """Pitches `agenda` to every dossier in `dossiers` and saves the run with all the answers.
    `vote_rules` (the workspace's, from the auth service) is saved with the run as it was at the start.
    Every Claude call ends within SIMULATION_TIMEOUT_SECONDS of the start, so the run is always saved.
    If anything fails, the run is saved as failed, with a reason safe to show (the details are logged)."""
    deadline = time.monotonic() + settings.SIMULATION_TIMEOUT_SECONDS
    run = SimulationRun.objects.create(
        workspace_id=workspace_id, run_by=user_id, agenda=agenda, vote_rules=vote_rules
    )
    agenda_text = f"{agenda['title']}. {agenda['description']}"

    try:
        # One agenda, so one embedding for every member's evidence search.
        agenda_embedding = DossierEmbedder().embed_question(agenda_text)
        members = []
        for dossier in dossiers:
            version = simulation_version(dossier).version
            evidence = find_evidence(version, agenda_text, agenda_embedding=agenda_embedding)
            members.append((dossier, version, evidence))

        with ThreadPoolExecutor(max_workers=settings.SIMULATION_MAX_WORKERS) as pool:
            results = list(pool.map(lambda m: ask_member(m[1], agenda, m[2], deadline=deadline), members))

        run.answers = [
            {
                "memberId": str(dossier.member_id),
                "memberName": version.name,
                "memberSlug": dossier.member.slug,
                "dossierVersionId": str(version.pk),
                "versionNo": version.version_no,
                **result,
            }
            for (dossier, version, _), result in zip(members, results)
        ]
        run.status = SimulationRun.Status.DONE
    except Exception as error:
        logger.exception("Simulation run %s failed", run.id)
        run.status = SimulationRun.Status.FAILED
        run.error = failure_reason(error)

    run.save()
    return run
