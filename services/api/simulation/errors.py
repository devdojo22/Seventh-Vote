"""M4/05: simulation errors, in the API's standard body {"error", "code", "details"?} (core.exceptions)."""

from rest_framework import status
from rest_framework.exceptions import APIException


class LlmNotConfigured(APIException):
    """503: the server has no ANTHROPIC_API_KEY."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "AI simulation is not set up on this server."
    default_code = "llm_not_configured"


class SimulationFailed(APIException):
    """502: Claude did not answer for every member. The failed run is saved; its id is in `details`.
    The message is the run's error, which ai.llm.failure_reason keeps free of internal details."""

    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "The AI simulation failed. Try again."
    default_code = "simulation_failed"

    def __init__(self, run):
        super().__init__(run.error or None)
        self.details = {"runId": str(run.id)}
