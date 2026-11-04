from django.urls import path

from council import views

urlpatterns = [
    path("dossiers", views.DossierListCreateView.as_view(), name="dossier-list"),
    path("dossiers/<uuid:pk>", views.DossierDetailView.as_view(), name="dossier-detail"),
    path("dossiers/<uuid:pk>/restore", views.DossierRestoreView.as_view(), name="dossier-restore"),
    path("dossiers/<uuid:pk>/versions", views.DossierVersionListView.as_view(), name="dossier-versions"),
    path(
        "dossiers/<uuid:pk>/versions/<int:version_no>",
        views.DossierVersionDetailView.as_view(),
        name="dossier-version-detail",
    ),
    path("dossiers/<uuid:pk>/review", views.DossierReviewView.as_view(), name="dossier-review"),
    path("dossiers/<uuid:pk>/review-history", views.DossierReviewHistoryView.as_view(), name="dossier-review-history"),
    path("dossiers/<uuid:pk>/evidence", views.DossierEvidenceView.as_view(), name="dossier-evidence"),
]
