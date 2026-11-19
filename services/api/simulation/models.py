import uuid
from django.db import models


class SimulationRun(models.Model):
    """One pitch of an agenda item, to one member (Prep page) or to the whole council (Session page)."""

    class Status(models.TextChoices):
        RUNNING = "running", "Running"
        DONE = "done", "Done"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace_id = models.UUIDField(db_index=True)
    run_by = models.UUIDField()  # the user who ran it
    created_at = models.DateTimeField(auto_now_add=True)
    agenda = models.JSONField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.RUNNING)
    error = models.TextField(blank=True) 
    answers = models.JSONField(default=list)
    vote_rules = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "simulation_runs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.agenda.get('title', 'Untitled')} ({self.status})"
