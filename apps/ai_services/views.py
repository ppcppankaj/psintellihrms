"""AI ViewSets

SECURITY:
- AIModelVersionViewSet: Superuser only (manages ML models)
- AIPredictionViewSet: Authenticated users (read), Superuser (write)
"""
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import AIModelVersion, AIPrediction
from .serializers import AIModelVersionSerializer, AIPredictionSerializer


class IsSuperuserOnly(permissions.BasePermission):
    """Only allow superusers to access these endpoints."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser


class IsSuperuserOrReadOnly(permissions.BasePermission):
    """Allow read for authenticated users, write only for superusers."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_superuser


class AIModelVersionViewSet(viewsets.ModelViewSet):
    """AI Model Version management - Superuser only"""
    queryset = AIModelVersion.objects.all()
    serializer_class = AIModelVersionSerializer
    permission_classes = [IsSuperuserOnly]
    filterset_fields = ['model_type', 'is_active']

    @action(detail=True, methods=['post'])
    def predict(self, request, pk=None):
        """Generate a stub prediction for an entity"""
        model_version = self.get_object()
        entity_type = request.data.get('entity_type')
        entity_id = request.data.get('entity_id')
        if not entity_type or not entity_id:
            return Response({'success': False, 'message': 'entity_type and entity_id required'}, status=status.HTTP_400_BAD_REQUEST)

        prediction = {
            'model_version': str(model_version.id),
            'entity_type': entity_type,
            'entity_id': entity_id,
            'score': request.data.get('score', 0.5),
            'timestamp': timezone.now().isoformat(),
        }
        aip = AIPrediction.objects.create(
            model_version=model_version,
            entity_type=entity_type,
            entity_id=entity_id,
            prediction=prediction,
            confidence=request.data.get('confidence', 0.5),
            reviewed_by=getattr(request.user, 'employee', None)
        )
        return Response({'success': True, 'data': AIPredictionSerializer(aip).data}, status=status.HTTP_201_CREATED)


class AIPredictionViewSet(viewsets.ModelViewSet):
    """AI Predictions - Read for authenticated, Write for superuser"""
    queryset = AIPrediction.objects.all()
    serializer_class = AIPredictionSerializer
    permission_classes = [IsSuperuserOrReadOnly]
    filterset_fields = ['entity_type', 'human_reviewed']

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        prediction = self.get_object()
        prediction.human_reviewed = True
        prediction.reviewed_by = getattr(request.user, 'employee', None)
        prediction.save(update_fields=['human_reviewed', 'reviewed_by'])
        return Response({'success': True, 'data': self.get_serializer(prediction).data})

    @action(detail=True, methods=['post'])
    def override(self, request, pk=None):
        prediction = self.get_object()
        prediction.human_reviewed = True
        prediction.human_override = request.data.get('override', {})
        prediction.reviewed_by = getattr(request.user, 'employee', None)
        prediction.save(update_fields=['human_reviewed', 'human_override', 'reviewed_by'])
        return Response({'success': True, 'data': self.get_serializer(prediction).data})
