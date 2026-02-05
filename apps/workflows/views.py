"""
Workflow ViewSets with Branch Filtering
"""

from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import WorkflowDefinition, WorkflowInstance, WorkflowAction, WorkflowStep
from .serializers import (
    WorkflowDefinitionSerializer, WorkflowInstanceSerializer, 
    WorkflowActionSerializer, WorkflowStepSerializer, EscalateSerializer
)
from .services import WorkflowService
from apps.core.permissions_branch import BranchFilterBackend, BranchPermission


class WorkflowStepViewSet(viewsets.ModelViewSet):
    """Workflow Steps - Configuration (read-only for most users)"""
    queryset = WorkflowStep.objects.select_related('workflow').all()
    serializer_class = WorkflowStepSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['workflow']
    search_fields = ['name']


class IsHRAdminOrReadOnly(permissions.BasePermission):
    """Allow read for authenticated, write only for HR admins/superusers."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        # Check for superuser or org admin
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'is_org_admin') and request.user.is_org_admin:
            return True
        # Check for HR admin permission
        if hasattr(request.user, 'has_permission_for'):
            return request.user.has_permission_for('workflows.manage')
        return False


class WorkflowDefinitionViewSet(viewsets.ModelViewSet):
    """
    Workflow Definitions - Organization-scoped templates
    Defines approval chains for leave, expenses, etc.
    
    SECURITY: Read access for authenticated users, write only for HR admins.
    """
    queryset = WorkflowDefinition.objects.all()
    serializer_class = WorkflowDefinitionSerializer
    permission_classes = [IsHRAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['entity_type', 'is_active']
    search_fields = ['name', 'code']

    @action(detail=False, methods=['get'])
    def by_entity_type(self, request):
        """Get workflow definition for a specific entity type"""
        entity_type = request.query_params.get('entity_type')
        if not entity_type:
            return Response(
                {'error': 'entity_type parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        workflow = self.get_queryset().filter(
            entity_type=entity_type, is_active=True
        ).first()
        if workflow:
            return Response(self.get_serializer(workflow).data)
        return Response(
            {'error': f'No workflow defined for {entity_type}'},
            status=status.HTTP_404_NOT_FOUND
        )


class WorkflowInstanceViewSet(viewsets.ModelViewSet):
    """
    Workflow Instances - Branch-filtered via current_approver's branch
    Tracks individual approval requests
    """
    queryset = WorkflowInstance.objects.select_related(
        'workflow', 'current_approver'
    ).all()
    serializer_class = WorkflowInstanceSerializer
    permission_classes = [IsAuthenticated, BranchPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'entity_type', 'workflow']
    search_fields = ['entity_type']

    def get_queryset(self):
        """
        Filter workflow instances by user's accessible branches
        Users see instances where they are the approver or the requester
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_superuser:
            return queryset
        
        # Get user's accessible branches
        from apps.authentication.models_hierarchy import BranchUser
        branch_ids = list(BranchUser.objects.filter(
            user=user, is_active=True
        ).values_list('branch_id', flat=True))
        
        # Get employee if exists
        employee = self._get_employee(self.request)
        
        if employee:
            # User can see instances where:
            # 1. They are the current approver
            # 2. They initiated the request (via entity lookup)
            # 3. The approver is in their branch
            return queryset.filter(
                Q(current_approver=employee) |
                Q(current_approver__branch_id__in=branch_ids) |
                Q(current_approver__isnull=True, workflow__organization=user.get_organization())
            ).distinct()
        
        return queryset.none()

    def _get_employee(self, request):
        """Helper to get employee profile for current user"""
        if not hasattr(request, '_employee'):
            from apps.employees.models import Employee
            request._employee = Employee.objects.filter(user=request.user).first()
        return request._employee

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a workflow instance"""
        instance = self.get_object()
        actor = self._get_employee(request)
        
        if not actor:
            return Response(
                {"error": "No employee record found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if instance.current_approver != actor:
            return Response(
                {"error": "You are not the current approver"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        comments = request.data.get('comments', '')
        WorkflowService.take_action(instance, actor, 'approved', comments)
        
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a workflow instance"""
        instance = self.get_object()
        actor = self._get_employee(request)
        
        if not actor:
            return Response(
                {"error": "No employee record found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if instance.current_approver != actor:
            return Response(
                {"error": "You are not the current approver"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        comments = request.data.get('comments', '')
        if not comments:
            return Response(
                {"error": "Comments required for rejection"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        WorkflowService.take_action(instance, actor, 'rejected', comments)
        
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['post'])
    def delegate(self, request, pk=None):
        """Delegate approval to another user"""
        instance = self.get_object()
        actor = self._get_employee(request)
        delegate_to_id = request.data.get('delegate_to')
        
        if not actor:
            return Response(
                {"error": "No employee record found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if instance.current_approver != actor:
            return Response(
                {"error": "You are not the current approver"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not delegate_to_id:
            return Response(
                {"error": "delegate_to employee ID required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.employees.models import Employee
        try:
            delegate_to = Employee.objects.get(id=delegate_to_id)
            instance.current_approver = delegate_to
            instance.save()
            
            # Record delegation action
            WorkflowAction.objects.create(
                instance=instance,
                step=instance.current_step,
                actor=actor,
                action='delegated',
                comments=f"Delegated to {delegate_to.full_name}"
            )
            
            return Response(self.get_serializer(instance).data)
        except Employee.DoesNotExist:
            return Response(
                {"error": "Delegate employee not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], url_path='my-approvals')
    def my_approvals(self, request):
        """Get pending approvals for current user"""
        actor = self._get_employee(request)
        if not actor:
            return Response(
                {"error": "No employee record found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Pending items where user is the current approver
        pending = self.get_queryset().filter(
            current_approver=actor, 
            status='in_progress'
        ).order_by('-created_at')
        
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my_pending')
    def my_pending(self, request):
        """Alias for my_approvals - matches frontend API call"""
        return self.my_approvals(request)

    @action(detail=False, methods=['get'], url_path='my-requests')
    def my_requests(self, request):
        """Get workflow instances initiated by current user"""
        actor = self._get_employee(request)
        if not actor:
            return Response([])
        
        # Find instances where user is the requester (via entity)
        # This requires looking up the entity and checking its creator
        # For now, return instances created around user's entities
        queryset = self.get_queryset().filter(
            workflowaction__actor=actor
        ).distinct().order_by('-created_at')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get approval statistics for current user"""
        actor = self._get_employee(request)
        if not actor:
            return Response(
                {"error": "No employee record found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        from datetime import timedelta
        
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        queryset = self.get_queryset()
        
        # Pending count (assigned to current user and in progress)
        pending_count = queryset.filter(
            current_approver=actor, 
            status='in_progress'
        ).count()
        
        # Actions taken today
        today_actions = WorkflowAction.objects.filter(
            actor=actor,
            created_at__gte=today_start
        )
        approved_today = today_actions.filter(action='approved').count()
        rejected_today = today_actions.filter(action='rejected').count()
        
        # Overdue (SLA exceeded) - check instances where SLA deadline has passed
        overdue_count = queryset.filter(
            current_approver=actor,
            status='in_progress',
            workflow__sla_hours__isnull=False
        ).extra(
            where=["started_at + (workflow.sla_hours || ' hours')::interval < NOW()"]
        ).count() if hasattr(queryset, 'extra') else 0
        
        # Simplified overdue calculation without complex SQL
        # Check instances older than typical SLA (e.g., 48 hours)
        sla_cutoff = timezone.now() - timedelta(hours=48)
        overdue_count = queryset.filter(
            current_approver=actor,
            status='in_progress',
            started_at__lt=sla_cutoff
        ).count()
        
        # Average turnaround (completed instances where user was approver)
        completed_instances = WorkflowAction.objects.filter(
            actor=actor,
            action__in=['approved', 'rejected'],
            instance__completed_at__isnull=False
        ).select_related('instance')
        
        avg_turnaround_hours = 0
        if completed_instances.exists():
            total_hours = 0
            count = 0
            for action in completed_instances[:100]:  # Limit for performance
                if action.instance.completed_at and action.instance.started_at:
                    delta = action.instance.completed_at - action.instance.started_at
                    total_hours += delta.total_seconds() / 3600
                    count += 1
            if count > 0:
                avg_turnaround_hours = round(total_hours / count, 1)
        
        stats = {
            'pending_count': pending_count,
            'approved_today': approved_today,
            'rejected_today': rejected_today,
            'overdue_count': overdue_count,
            'avg_turnaround_hours': avg_turnaround_hours,
            # Keep legacy fields for compatibility
            'pending': pending_count,
            'approved_by_me': WorkflowAction.objects.filter(actor=actor, action='approved').count(),
            'rejected_by_me': WorkflowAction.objects.filter(actor=actor, action='rejected').count(),
            'delegated_by_me': WorkflowAction.objects.filter(actor=actor, action='delegated').count(),
        }
        return Response(stats)

    @action(detail=False, methods=['get'], url_path='team-requests')
    def team_requests(self, request):
        """Get workflow instances for user's subordinates"""
        actor = self._get_employee(request)
        if not actor:
            return Response([])
        
        # Get subordinates (employees who report to this user)
        from apps.employees.models import Employee
        subordinate_ids = Employee.objects.filter(
            reporting_manager=actor,
            is_active=True
        ).values_list('id', flat=True)
        
        # Get instances where subordinates are requester (through entity)
        # For now, filter by instances that were created by subordinates
        # This is simplified - real implementation would check entity ownership
        status_filter = request.query_params.get('status')
        queryset = self.get_queryset().filter(
            workflowaction__actor_id__in=subordinate_ids
        ).distinct()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        queryset = queryset.order_by('-created_at')[:50]
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })

    @action(detail=False, methods=['get'], url_path='workflow-history')
    def workflow_history(self, request):
        """Get workflow history for current user (completed approvals)"""
        actor = self._get_employee(request)
        if not actor:
            return Response({
                'results': [],
                'count': 0
            })
        
        # Get instances where user took an action (approved, rejected, delegated)
        action_instance_ids = WorkflowAction.objects.filter(
            actor=actor
        ).values_list('instance_id', flat=True).distinct()
        
        queryset = self.get_queryset().filter(
            id__in=action_instance_ids
        ).order_by('-completed_at', '-created_at')
        
        # Apply type filter if provided
        type_filter = request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(entity_type=type_filter)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get approval history for a workflow instance"""
        instance = self.get_object()
        actions = WorkflowAction.objects.filter(
            instance=instance
        ).select_related('actor').order_by('created_at')
        
        return Response(WorkflowActionSerializer(actions, many=True).data)
    
    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        """Manually escalate a workflow instance to a higher authority"""
        instance = self.get_object()
        actor = self._get_employee(request)
        
        if not actor:
            return Response(
                {"error": "No employee record found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = EscalateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reason = serializer.validated_data['reason']
        escalate_to_id = serializer.validated_data.get('escalate_to')
        
        if instance.status != 'in_progress':
            return Response(
                {"error": "Only in-progress workflows can be escalated"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            escalated_instance = WorkflowService.escalate_workflow(
                instance=instance,
                actor=actor,
                reason=reason,
                escalate_to_id=escalate_to_id
            )
            return Response(self.get_serializer(escalated_instance).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='process-parallel')
    def process_parallel(self, request, pk=None):
        """Process parallel approval step - for steps that require multiple approvers"""
        instance = self.get_object()
        actor = self._get_employee(request)
        
        if not actor:
            return Response(
                {"error": "No employee record found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        action_type = request.data.get('action', 'approved')
        comments = request.data.get('comments', '')
        
        if action_type not in ['approved', 'rejected']:
            return Response(
                {"error": "Action must be 'approved' or 'rejected'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action_type == 'rejected' and not comments:
            return Response(
                {"error": "Comments required for rejection"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = WorkflowService.process_parallel_approval(
                instance=instance,
                actor=actor,
                action=action_type,
                comments=comments
            )
            return Response(self.get_serializer(result).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WorkflowActionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Workflow Actions - Read-only audit trail
    Records all approval/rejection/delegation actions
    """
    queryset = WorkflowAction.objects.select_related(
        'instance', 'actor'
    ).all()
    serializer_class = WorkflowActionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['instance', 'actor', 'action']

    def get_queryset(self):
        """Filter by user's accessible branches through actor"""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_superuser:
            return queryset
        
        from apps.authentication.models_hierarchy import BranchUser
        branch_ids = BranchUser.objects.filter(
            user=user, is_active=True
        ).values_list('branch_id', flat=True)
        
        return queryset.filter(actor__branch_id__in=branch_ids)
