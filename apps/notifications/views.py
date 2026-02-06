"""
Notification ViewSets

SECURITY:
- NotificationViewSet: Authenticated users can only see their own notifications
- NotificationTemplateViewSet: HR Admin / Superuser only (system templates)
- NotificationPreferenceViewSet: Users can only manage their own preferences
"""

from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, NotificationTemplate, NotificationPreference
from .serializers import (
    NotificationSerializer, NotificationTemplateSerializer, NotificationPreferenceSerializer,
    PushNotificationSerializer, SendDigestSerializer
)
from .services import NotificationService
from apps.core.tenant_guards import OrganizationViewSetMixin


class IsHRAdminOrSuperuser(permissions.BasePermission):
    """Only HR admins or superusers can manage notification templates."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'is_org_admin') and request.user.is_org_admin:
            return True
        if hasattr(request.user, 'has_permission_for'):
            return request.user.has_permission_for('notifications.manage_templates')
        return False


class NotificationViewSet(OrganizationViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """User notifications - users can only see their own."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return super().get_queryset().filter(recipient__user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        NotificationService.mark_as_read(pk)
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        """Mark all notifications as read - kebab-case URL"""
        NotificationService.mark_all_as_read(request.user)
        return Response({'status': 'all marked as read'})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Get unread notification count - kebab-case URL"""
        count = Notification.objects.filter(recipient__user=request.user).exclude(status='read').count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'], url_path='push')
    def push_notification(self, request):
        """
        Send push notification to specified recipients.
        This is a stub endpoint - actual push implementation depends on 
        external service (Firebase FCM, OneSignal, etc.)
        """
        serializer = PushNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        recipient_ids = serializer.validated_data['recipient_ids']
        title = serializer.validated_data['title']
        body = serializer.validated_data['body']
        data = serializer.validated_data.get('data', {})
        priority = serializer.validated_data.get('priority', 'normal')
        
        results = NotificationService.send_push_notifications(
            recipient_ids=recipient_ids,
            title=title,
            body=body,
            data=data,
            priority=priority
        )
        
        return Response(results)
    
    @action(detail=False, methods=['post'], url_path='send-digest')
    def send_digest(self, request):
        """
        Send digest notifications (batch of unread notifications).
        Useful for daily/weekly summary emails.
        """
        serializer = SendDigestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        digest_type = serializer.validated_data['digest_type']
        recipient_ids = serializer.validated_data.get('recipient_ids', [])
        
        results = NotificationService.send_digest(
            digest_type=digest_type,
            recipient_ids=recipient_ids
        )
        
        return Response(results)


class NotificationTemplateViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing notification templates - HR Admin/Superuser only"""
    queryset = NotificationTemplate.objects.none()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsHRAdminOrSuperuser]
    
    def get_queryset(self):
        return super().get_queryset()


class NotificationPreferenceViewSet(
    OrganizationViewSetMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    User notification preferences - users can only view/update their own.
    Uses GET /preferences/ to retrieve, PUT/PATCH to update.
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get or create preference for current user"""
        preference, _ = NotificationPreference.objects.get_or_create(
            user=self.request.user,
            defaults={
                'organization': getattr(self.request.user, 'organization', None)
            }
        )
        return preference
    
    def list(self, request, *args, **kwargs):
        """Override list to return current user's preferences"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Convenience endpoint: GET/PUT/PATCH /preferences/me/"""
        instance = self.get_object()
        
        if request.method == 'GET':
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        
        partial = request.method == 'PATCH'
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
