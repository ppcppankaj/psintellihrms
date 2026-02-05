"""
Workflow Serializers
"""

from rest_framework import serializers
from django.utils import timezone
from .models import WorkflowDefinition, WorkflowStep, WorkflowInstance, WorkflowAction
from apps.employees.serializers import EmployeeListSerializer

class WorkflowStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStep
        fields = '__all__'


class EscalateSerializer(serializers.Serializer):
    """Serializer for manual escalation"""
    reason = serializers.CharField(required=True, help_text="Reason for escalation")
    escalate_to = serializers.UUIDField(
        required=False, 
        allow_null=True,
        help_text="Optional specific employee to escalate to"
    )

class WorkflowDefinitionSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, read_only=True, source='workflow_steps')
    
    class Meta:
        model = WorkflowDefinition
        fields = '__all__'

class WorkflowActionSerializer(serializers.ModelSerializer):
    actor_details = EmployeeListSerializer(source='actor', read_only=True)
    
    class Meta:
        model = WorkflowAction
        fields = '__all__'


class WorkflowInstanceSerializer(serializers.ModelSerializer):
    """
    Enhanced serializer that provides fields expected by frontend ApprovalRequest type
    """
    actions = WorkflowActionSerializer(many=True, read_only=True)
    approver_details = EmployeeListSerializer(source='current_approver', read_only=True)
    workflow_name = serializers.ReadOnlyField(source='workflow.name')
    
    # Computed fields to match frontend ApprovalRequest interface
    request_type = serializers.SerializerMethodField()
    request_id = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    requester = serializers.SerializerMethodField()
    total_steps = serializers.SerializerMethodField()
    priority = serializers.SerializerMethodField()
    sla_deadline = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    steps = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowInstance
        fields = [
            'id', 'workflow', 'workflow_name', 'entity_type', 'entity_id',
            'current_step', 'status', 'started_at', 'completed_at',
            'current_approver', 'approver_details', 'actions', 'created_at', 'updated_at',
            # Computed fields for frontend compatibility
            'request_type', 'request_id', 'title', 'description', 'requester',
            'total_steps', 'priority', 'sla_deadline', 'is_overdue', 'steps'
        ]
    
    def _get_entity(self, obj):
        """Fetch the actual entity (LeaveRequest, Expense, etc.)"""
        if not hasattr(obj, '_cached_entity'):
            obj._cached_entity = None
            try:
                from django.apps import apps
                # Map entity_type to actual model
                entity_map = {
                    'leaverequest': ('leave', 'LeaveRequest'),
                    'expense': ('expenses', 'Expense'),
                    'expenseclaim': ('expenses', 'ExpenseClaim'),
                    'attendance': ('attendance', 'AttendanceCorrection'),
                    'resignation': ('transitions', 'EmployeeTransition'),
                }
                if obj.entity_type in entity_map:
                    app, model_name = entity_map[obj.entity_type]
                    Model = apps.get_model(app, model_name)
                    obj._cached_entity = Model.objects.filter(id=obj.entity_id).first()
            except Exception:
                pass
        return obj._cached_entity
    
    def get_request_type(self, obj):
        """Map entity_type to frontend request_type"""
        type_map = {
            'leaverequest': 'leave',
            'expense': 'expense',
            'expenseclaim': 'expense',
            'attendance': 'attendance',
            'attendancecorrection': 'attendance',
            'resignation': 'resignation',
            'employeetransition': 'resignation',
        }
        return type_map.get(obj.entity_type, obj.entity_type)
    
    def get_request_id(self, obj):
        return str(obj.entity_id)
    
    def get_title(self, obj):
        """Generate a human-readable title"""
        entity = self._get_entity(obj)
        if entity:
            # Try to get title from entity
            if hasattr(entity, 'title'):
                return entity.title
            if hasattr(entity, 'leave_type') and hasattr(entity, 'employee'):
                return f"{entity.leave_type.name} - {entity.employee.full_name}"
            if hasattr(entity, 'description'):
                return entity.description[:50] if entity.description else 'No description'
        return f"{obj.entity_type.replace('_', ' ').title()} Request"
    
    def get_description(self, obj):
        entity = self._get_entity(obj)
        if entity and hasattr(entity, 'reason'):
            return entity.reason
        return None
    
    def get_requester(self, obj):
        """Get the requester (employee who initiated the request)"""
        entity = self._get_entity(obj)
        employee = None
        
        if entity:
            # Try common patterns for getting employee
            if hasattr(entity, 'employee'):
                employee = entity.employee
            elif hasattr(entity, 'submitted_by'):
                employee = entity.submitted_by
            elif hasattr(entity, 'user'):
                from apps.employees.models import Employee
                employee = Employee.objects.filter(user=entity.user).first()
        
        if employee:
            return {
                'id': str(employee.id),
                'employee_id': employee.employee_id or '',
                'full_name': employee.full_name,
                'avatar': employee.avatar.url if employee.avatar else None,
                'department': employee.department.name if employee.department else '',
                'designation': employee.designation.name if employee.designation else '',
            }
        return None
    
    def get_total_steps(self, obj):
        if obj.workflow:
            return obj.workflow.workflow_steps.count()
        return 1
    
    def get_priority(self, obj):
        """Determine priority based on SLA or entity urgency"""
        entity = self._get_entity(obj)
        if entity and hasattr(entity, 'priority'):
            return entity.priority
        # Default based on overdue status
        if self.get_is_overdue(obj):
            return 'urgent'
        return 'normal'
    
    def get_sla_deadline(self, obj):
        if obj.workflow and obj.workflow.sla_hours:
            from datetime import timedelta
            deadline = obj.started_at + timedelta(hours=obj.workflow.sla_hours)
            return deadline.isoformat()
        return None
    
    def get_is_overdue(self, obj):
        if obj.workflow and obj.workflow.sla_hours:
            from datetime import timedelta
            deadline = obj.started_at + timedelta(hours=obj.workflow.sla_hours)
            return timezone.now() > deadline and obj.status == 'in_progress'
        return False
    
    def get_steps(self, obj):
        """Get workflow steps with status"""
        if not obj.workflow:
            return []
        
        steps = obj.workflow.workflow_steps.all().order_by('order')
        actions_by_step = {a.step: a for a in obj.actions.all()}
        
        result = []
        for step in steps:
            action = actions_by_step.get(step.order)
            result.append({
                'id': str(step.id),
                'order': step.order,
                'name': step.name,
                'approver_type': step.approver_type,
                'approver_role': {'id': str(step.approver_role.id), 'name': step.approver_role.name} if step.approver_role else None,
                'approver_user': {'id': str(step.approver_user.id), 'full_name': step.approver_user.full_name} if step.approver_user else None,
                'status': action.action if action else ('pending' if step.order >= obj.current_step else 'skipped'),
                'completed_at': action.created_at.isoformat() if action else None,
                'completed_by': {'id': str(action.actor.id), 'full_name': action.actor.full_name} if action and action.actor else None,
                'comments': action.comments if action else None,
            })
        return result
