from django.urls import include, path

from core.views import health

urlpatterns = [
    path("api/health", health),
    path("api/", include("council.urls")),
    path("api/simulations/", include("simulation.urls")),
]
