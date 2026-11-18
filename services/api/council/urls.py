from django.urls import path

from ai.views import EvidenceSearchView  # M4/03
from council import views

urlpatterns = [
    # M4/01: council as the simulator reads it
    path("council", views.CouncilView.as_view(), name="council"),
    path("dossiers", views.DossierListCreateView.as_view(), name="dossier-list"),
    path("dossiers/<str:ref>", views.DossierDetailView.as_view(), name="dossier-detail"),
    path("dossiers/<str:ref>/restore", views.DossierRestoreView.as_view(), name="dossier-restore"),
    path(
        "dossiers/<str:ref>/archive-history",
        views.DossierArchiveHistoryView.as_view(),
        name="dossier-archive-history",
    ),
    path("dossiers/<str:ref>/versions", views.DossierVersionListView.as_view(), name="dossier-versions"),
    path(
        "dossiers/<str:ref>/versions/<int:version_no>",
        views.DossierVersionDetailView.as_view(),
        name="dossier-version-detail",
    ),
    path("dossiers/<str:ref>/review", views.DossierReviewView.as_view(), name="dossier-review"),
    path("dossiers/<str:ref>/review-history", views.DossierReviewHistoryView.as_view(), name="dossier-review-history"),
    path("dossiers/<str:ref>/evidence", views.DossierEvidenceView.as_view(), name="dossier-evidence"),
    path("dossiers/<str:ref>/evidence-search", EvidenceSearchView.as_view(), name="dossier-evidence-search"),
]
