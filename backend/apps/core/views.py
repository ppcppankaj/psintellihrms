from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status
from .models import AuditLog, FeatureFlag, Organization
from .serializers import AuditLogSerializer, FeatureFlagSerializer, OrganizationSerializer
from apps.core.tenant_guards import OrganizationViewSetMixin

from django.http import JsonResponse
from rest_framework.throttling import AnonRateThrottle
from .throttling import LoginRateThrottle

def api_404_view(request, exception=None):
    return JsonResponse(
        {'detail': 'Endpoint not found'},
        status=404
    )

# =============================================================================
# ORGANIZATION VIEWSET - SUPERUSER ONLY
# =============================================================================

class IsSuperuser(permissions.BasePermission):
    """
    🔐 Only superusers can manage organizations
    
    Superuser: Create, read, update, delete all organizations
    Org Admin: Read own organization only
    Regular User: No access
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusers full access
        if request.user.is_superuser:
            return True
        
        # Org admins can list/retrieve (own org only)
        if request.user.is_org_admin and request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        # Org admin can only access own org
        if request.user.is_org_admin and request.user.organization_id == obj.id:
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return True
        
        return False

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    🏢 Organization Management - Superuser Only
    
    Rules:
    - Superuser: See all orgs, create, edit, delete
    - Org Admin: See only own organization (read-only)
    - Regular User: No access
    
    Endpoints:
    - GET /api/organizations/ - List (filtered by role)
    - POST /api/organizations/ - Create (superuser only)
    - GET /api/organizations/{id}/ - Retrieve
    - PUT /api/organizations/{id}/ - Update (superuser only)
    - PATCH /api/organizations/{id}/ - Partial update (superuser only)
    - DELETE /api/organizations/{id}/ - Delete (superuser only)
    """
    
    queryset = Organization.objects.none()
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperuser]
    
    def get_queryset(self):
        """
        🔍 Visibility:
        - Superuser: All organizations
        - Org Admin: Own organization only
        - Regular User: Empty queryset
        """
        user = self.request.user
        
        if user.is_superuser:
            return Organization.objects.filter()
        
        if user.is_org_admin and user.organization:
            return Organization.objects.filter(id=user.organization_id)
        
        return Organization.objects.none()
    
    def create(self, request, *args, **kwargs):
        """🔐 SUPERUSER ONLY - Create organization"""
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can create organizations.")
        
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """🔐 SUPERUSER ONLY - Update organization"""
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can modify organizations.")
        
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """🔐 SUPERUSER ONLY - Partial update"""
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can modify organizations.")
        
        return super().partial_update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """🔐 SUPERUSER ONLY - Delete organization"""
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can delete organizations.")
        
        return super().destroy(request, *args, **kwargs)

class AuditLogViewSet(OrganizationViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing audit logs.
    ReadOnly as audit logs should never be modified via API.
    """
    queryset = AuditLog.objects.none()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Admin check can be added here if needed
        # For now, let's keep it simple
        
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
            
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
            
        return queryset

            
class IsSuperuserOnly(permissions.BasePermission):
    """Only allow superusers to modify feature flags."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Allow read for authenticated users (to check flags)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only superusers can modify
        return request.user.is_superuser


class FeatureFlagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing feature flags.
    SECURITY: Read access for authenticated users, write only for superusers.
    """
    queryset = FeatureFlag.objects.none()
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsSuperuserOnly]
    
    def get_queryset(self):
        return FeatureFlag.objects.filter()

