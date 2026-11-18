from django.contrib import admin
from django.contrib.staticfiles.views import serve
from django.urls import include, path, re_path

from core.views import health

urlpatterns = [
    path("api/admin/", admin.site.urls),
    re_path(r"^api/static/(?P<path>.*)$", serve, {"insecure": True}),
    path("api/health", health),
    path("api/", include("council.urls")),
    path("api/simulations/", include("simulation.urls")),
]
