from django.contrib import admin
from simulation.models import SimulationRun


@admin.register(SimulationRun)
class SimulationRunAdmin(admin.ModelAdmin):
    list_display = ["agenda_title", "status", "member_count", "created_at"]
    list_filter = ["status"]

    @admin.display(description="Agenda")
    def agenda_title(self, obj):
        return obj.agenda.get("title", "Untitled")

    @admin.display(description="Members")
    def member_count(self, obj):
        return len(obj.answers)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
