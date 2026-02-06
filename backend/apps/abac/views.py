"""
ABAC Views - Attribute-Based Access Control management
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    AttributeType, Policy, PolicyRule, UserPolicy, 
    GroupPolicy, PolicyLog, Role, Permission, RoleAssignment
)
from .serializers import (
    AttributeTypeSerializer, PolicySerializer, PolicyDetailSerializer,
    PolicyRuleSerializer, UserPolicySerializer, GroupPolicySerializer,
    PolicyLogSerializer, RoleSerializer, PermissionSerializer, RoleAssignmentSerializer
)
from .permissions import IsHRAdmin
from .engine import PolicyEngine

from apps.core.tenant_guards import OrganizationViewSetMixin


class AttributeTypeViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing attribute types"""
    
    queryset = AttributeType.objects.none()
    serializer_class = AttributeTypeSerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    filterset_fields = ['category', 'data_type']
    search_fields = ['name', 'code', 'description']


class PolicyViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing policies"""
    
    queryset = Policy.objects.none()
    serializer_class = PolicySerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    filterset_fields = ['policy_type', 'effect', 'is_active', 'resource_type']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['priority', 'name', 'created_at']
    ordering = ['-priority', 'name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PolicyDetailSerializer
        return PolicySerializer
    
    @action(detail=True, methods=['post'])
    def add_rule(self, request, pk=None):
        """Add a rule to this policy"""
        policy = self.get_object()
        serializer = PolicyRuleSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(policy=policy, organization=policy.tenant)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], url_path='remove-rule/(?P<rule_id>[^/.]+)')
    def remove_rule(self, request, pk=None, rule_id=None):
        """Remove a rule from this policy"""
        policy = self.get_object()
        
        try:
            rule = PolicyRule.objects.get(id=rule_id, policy=policy)
            rule.delete()
            return Response({'success': True, 'message': 'Rule removed'})
        except PolicyRule.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Rule not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def check_access(self, request):
        """Check if current user has access based on policies"""
        resource_type = request.data.get('resource_type')
        action = request.data.get('action')
        resource_attrs = request.data.get('resource_attrs', {})
        resource_id = request.data.get('resource_id')
        
        if not resource_type or not action:
            return Response({
                'success': False,
                'message': 'resource_type and action are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        engine = PolicyEngine(request.user)
        has_access = engine.check_access(resource_type, action, resource_attrs, resource_id)
        
        return Response({
            'success': True,
            'has_access': has_access,
            'user': request.user.email,
            'resource_type': resource_type,
            'action': action
        })


class PolicyRuleViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing policy rules"""
    
    queryset = PolicyRule.objects.none()
    serializer_class = PolicyRuleSerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    filterset_fields = ['policy', 'operator', 'is_active']
    search_fields = ['attribute_path']


class UserPolicyViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing user policy assignments"""
    
    queryset = UserPolicy.objects.none()
    serializer_class = UserPolicySerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    filterset_fields = ['user', 'policy', 'is_active']
    search_fields = ['user__email', 'policy__name']
    
    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user, organization=self.request.tenant)
    
    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        """Assign policies to multiple users"""
        user_ids = request.data.get('user_ids', [])
        policy_ids = request.data.get('policy_ids', [])
        
        if not user_ids or not policy_ids:
            return Response({
                'success': False,
                'message': 'user_ids and policy_ids are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created = []
        for user_id in user_ids:
            for policy_id in policy_ids:
                user_policy, was_created = UserPolicy.objects.get_or_create(
                    user_id=user_id,
                    policy_id=policy_id,
                    organization=request.tenant,
                    defaults={'assigned_by': request.user, 'is_active': True}
                )
                if was_created:
                    created.append(user_policy)
        
        serializer = self.get_serializer(created, many=True)
        return Response({
            'success': True,
            'created_count': len(created),
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class GroupPolicyViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing group policy assignments"""
    
    queryset = GroupPolicy.objects.none()
    serializer_class = GroupPolicySerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    filterset_fields = ['group_type', 'is_active']
    search_fields = ['name', 'group_value']


class PolicyLogViewSet(OrganizationViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing policy evaluation logs (read-only)"""
    
    queryset = PolicyLog.objects.none()
    serializer_class = PolicyLogSerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset()
    filterset_fields = ['user', 'resource_type', 'action', 'result']
    search_fields = ['user__email', 'resource_type', 'resource_id']
    ordering_fields = ['evaluated_at']
    ordering = ['-evaluated_at']
    
    @action(detail=False, methods=['get'])
    def my_logs(self, request):
        """Get logs for current user"""
        logs = self.queryset.filter(user=request.user)
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def denials(self, request):
        """Get all access denials"""
        denials = self.queryset.filter(result=False)
        page = self.paginate_queryset(denials)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(denials, many=True)
        return Response(serializer.data)


class RoleViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing roles"""
    
    queryset = Role.objects.none()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'description']
    ordering = ['name']


class PermissionViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing permissions"""
    
    queryset = Permission.objects.none()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    filterset_fields = ['module', 'permission_type']
    search_fields = ['name', 'code', 'description', 'module']
    ordering = ['module', 'name']


class RoleAssignmentViewSet(OrganizationViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for managing user role assignments"""
    
    queryset = RoleAssignment.objects.none()
    serializer_class = RoleAssignmentSerializer
    permission_classes = [IsAuthenticated, IsHRAdmin]
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    filterset_fields = ['user', 'role', 'is_active', 'scope']
    search_fields = ['user__email', 'role__name']
    ordering = ['-assigned_at']
    
    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user, organization=self.request.tenant)

