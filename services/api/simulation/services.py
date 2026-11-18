from concurrent.futures import ThreadPoolExecutor
from ai.llm import ask_member
from ai.retrieval import find_evidence
from council.simulation_version import simulation_version
from simulation.models import SimulationRun


def run_simulation(*, workspace_id, user_id, agenda, dossiers, vote_rules=None):
    """Pitches `agenda` to every dossier in `dossiers` and saves the run with all the answers.
    `vote_rules` (the workspace's, from the auth service) is saved with the run as it was at the start.
    If anything fails, the run is saved as failed, with the reason."""
    run = SimulationRun.objects.create(
        workspace_id=workspace_id, run_by=user_id, agenda=agenda, vote_rules=vote_rules
    )
    agenda_text = f"{agenda['title']}. {agenda['description']}"

    try:
        members = []
        for dossier in dossiers:
            version = simulation_version(dossier).version
            members.append((dossier, version, find_evidence(version, agenda_text)))

        with ThreadPoolExecutor(max_workers=13) as pool:
            results = list(pool.map(lambda m: ask_member(m[1], agenda, m[2]), members))

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
        run.status = SimulationRun.Status.FAILED
        run.error = str(error)

    run.save()
    return run
