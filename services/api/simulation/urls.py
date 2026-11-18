from django.urls import path
from simulation import views

urlpatterns = [
    path("simulations", views.SimulationCreateView.as_view(), name="simulation-create"),  # M4/04
    path("simulations/<uuid:run_id>", views.SimulationDetailView.as_view(), name="simulation-detail"),  # M4/04
]
