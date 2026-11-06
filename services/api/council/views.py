from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import HasWorkspacePermission
from council import review, services
from council.models import Dossier, DossierArchiveEvent, DossierVersion, ReviewStatusChange
from council.serializers import (
    DossierArchiveEventSerializer,
    DossierCreateSerializer,
    DossierDetailSerializer,
    DossierListSerializer,
    DossierUpdateSerializer,
    DossierVersionSerializer,
    DossierVersionSummarySerializer,
    ReviewChangeRequestSerializer,
    ReviewStatusChangeSerializer,
    version_evidence,
)

CanViewDossiers = HasWorkspacePermission.of("viewDossiers")
CanEditDossiers = HasWorkspacePermission.of("editDossiers")


class DossierPermissionsMixin:
    """Reads need viewDossiers; anything that writes needs editDossiers."""

    def get_permissions(self):
        permission = CanViewDossiers if self.request.method in ("GET", "HEAD", "OPTIONS") else CanEditDossiers
        return [permission()]


class WorkspaceDossierMixin(DossierPermissionsMixin):
    """For /dossiers/{pk}/... routes: the dossier must belong to the caller's workspace, otherwise 404."""

    def get_dossier(self) -> Dossier:
        if not hasattr(self, "_dossier"):
            self._dossier = get_object_or_404(
                Dossier.objects.select_related("member", "current_version"),
                pk=self.kwargs["pk"],
                workspace_id=self.request.user.workspace_id,
            )
        return self._dossier

    def get_version(self, version_no: int | None) -> DossierVersion:
        """The given version of this dossier, or the current one when version_no is None."""
        dossier = self.get_dossier()
        if version_no is None:
            return dossier.current_version
        return get_object_or_404(DossierVersion, dossier=dossier, version_no=version_no)

    def version_no_from_query(self) -> int | None:
        raw = self.request.query_params.get("version")
        if raw is None:
            return None
        # ASCII digits only: str.isdigit() also accepts e.g. "²", which int() then rejects (a 500).
        if not (raw.isascii() and raw.isdigit()) or int(raw) < 1:
            raise ValidationError({"version": "Must be a positive whole number."})
        return int(raw)


# --- Step 2: list / create -------------------------------------------------------------------------------


class DossierListCreateView(DossierPermissionsMixin, generics.ListCreateAPIView):
    """GET /api/dossiers[?archived=true]: active members' dossiers in the caller's workspace, or only the
    archived ones.
    POST /api/dossiers: create a member and its dossier at version 1."""

    def get_serializer_class(self):
        return DossierCreateSerializer if self.request.method == "POST" else DossierListSerializer

    def get_queryset(self):
        archived = self.request.query_params.get("archived") == "true"
        return (
            Dossier.objects.filter(
                workspace_id=self.request.user.workspace_id, member__archived_at__isnull=not archived
            )
            .select_related("member", "current_version")
            .order_by("member__name")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dossier = services.create_dossier(
            workspace_id=request.user.workspace_id,
            user_id=request.user.user_id,
            member_data=serializer.validated_data.get("member", {}),
            content=serializer.validated_data["content"],
            change_note=serializer.validated_data["changeNote"],
        )
        return Response(DossierDetailSerializer(dossier).data, status=status.HTTP_201_CREATED)


# --- Step 3: retrieve / save new version / archive -------------------------------------------------------


class DossierDetailView(DossierPermissionsMixin, generics.RetrieveUpdateDestroyAPIView):
    """GET: the dossier with its current version (archived dossiers stay readable).
    PUT: save the full dossier as a new version; 409 if baseVersionNo is not the current version.
    DELETE: archive the member (soft delete, history kept)."""

    http_method_names = ["get", "put", "delete", "head", "options"]

    def get_serializer_class(self):
        return DossierUpdateSerializer if self.request.method == "PUT" else DossierDetailSerializer

    def get_queryset(self):
        return Dossier.objects.filter(workspace_id=self.request.user.workspace_id).select_related(
            "member", "current_version"
        )

    def update(self, request, *args, **kwargs):
        dossier = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved = services.save_dossier(
            dossier=dossier,
            user_id=request.user.user_id,
            base_version_no=serializer.validated_data["baseVersionNo"],
            member_data=serializer.validated_data.get("member", {}),
            content=serializer.validated_data["content"],
            change_note=serializer.validated_data["changeNote"],
        )
        return Response(DossierDetailSerializer(saved).data)

    def perform_destroy(self, instance):
        services.archive_dossier(instance, self.request.user.user_id)


class DossierRestoreView(WorkspaceDossierMixin, APIView):
    """POST /api/dossiers/{id}/restore: un-archive the member. Returns the dossier. A plain APIView: it takes no
    request body, and a GenericAPIView without a serializer_class fails OPTIONS (DRF's metadata asks for one)."""

    def post(self, request, *args, **kwargs):
        dossier = self.get_dossier()
        services.restore_dossier(dossier, request.user.user_id)
        dossier.member.refresh_from_db()
        return Response(DossierDetailSerializer(dossier).data)


class DossierArchiveHistoryView(WorkspaceDossierMixin, generics.ListAPIView):
    """GET /api/dossiers/{id}/archive-history: who archived or restored the dossier, newest first."""

    serializer_class = DossierArchiveEventSerializer

    def get_queryset(self):
        return DossierArchiveEvent.objects.filter(dossier=self.get_dossier())


# --- Step 4: version history -----------------------------------------------------------------------------


class DossierVersionListView(WorkspaceDossierMixin, generics.ListAPIView):
    """GET /api/dossiers/{id}/versions: every version, newest first."""

    serializer_class = DossierVersionSummarySerializer

    def get_queryset(self):
        return DossierVersion.objects.filter(dossier=self.get_dossier()).select_related("dossier")


class DossierVersionDetailView(WorkspaceDossierMixin, generics.RetrieveAPIView):
    """GET /api/dossiers/{id}/versions/{n}: one full version."""

    serializer_class = DossierVersionSerializer

    def get_object(self):
        return self.get_version(self.kwargs["version_no"])


# --- Step 5: review status -------------------------------------------------------------------------------


class DossierReviewView(WorkspaceDossierMixin, generics.CreateAPIView):
    """POST /api/dossiers/{id}/review {"status", "versionNo"}: change the review status of the version the
    reviewer looked at. 409 version_conflict if that is no longer the current version. Returns the logged
    change."""

    serializer_class = ReviewChangeRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        version = self.get_version(serializer.validated_data["versionNo"])
        change = review.change_status(
            version=version, to_status=serializer.validated_data["status"], principal=request.user
        )
        return Response(ReviewStatusChangeSerializer(change).data, status=status.HTTP_201_CREATED)


class DossierReviewHistoryView(WorkspaceDossierMixin, generics.ListAPIView):
    """GET /api/dossiers/{id}/review-history: every status change across all versions, newest first."""

    serializer_class = ReviewStatusChangeSerializer

    def get_queryset(self):
        return ReviewStatusChange.objects.filter(version__dossier=self.get_dossier()).select_related("version")


# --- Step 6: evidence ------------------------------------------------------------------------------------


class DossierEvidenceView(WorkspaceDossierMixin, generics.ListAPIView):
    """GET /api/dossiers/{id}/evidence[?version=n]: every source one version cites, as one flat list with a
    `kind` per item. Key records and quotes keep their lineageId across versions."""

    def list(self, request, *args, **kwargs):
        return Response(version_evidence(self.get_version(self.version_no_from_query())))
