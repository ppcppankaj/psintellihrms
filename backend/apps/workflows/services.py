"""
Workflow Services - Core Approval Engine Logic
"""

from django.utils import timezone
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from .models import WorkflowDefinition, WorkflowStep, WorkflowInstance, WorkflowAction
from apps.employees.models import Employee

class WorkflowService:
    """
    Service to manage workflow lifecycles, transitions, and actions.
    """

    @staticmethod
    def start_workflow(entity, workflow_code, initiator=None):
        """
        Initialize a workflow instance for a given entity.
        """
        try:
            definition = WorkflowDefinition.objects.get(code=workflow_code)
        except WorkflowDefinition.DoesNotExist:
            return None

        # Get first step
        first_step = definition.workflow_steps.filter(order=1).first()
        if not first_step:
            return None

        # Determine initial approver
        approver = WorkflowService.get_approver_for_step(first_step, entity, initiator)

        instance = WorkflowInstance.objects.create(
            workflow=definition,
            entity_type=entity._meta.model_name,
            entity_id=entity.id,
            current_step=1,
            status='in_progress',
            current_approver=approver,
            organization=entity.organization  # Ensure organization is preserved
        )
        return instance

    @staticmethod
    def get_approver_for_step(step, entity, initiator=None):
        """
        Logic to resolve the specific employee who should approve a step.
        """
        if step.approver_type == 'reporting_manager':
            # Assuming entity has an 'employee' field (like LeaveRequest)
            employee = getattr(entity, 'employee', None)
            if employee and employee.reporting_manager:
                return employee.reporting_manager
        
        elif step.approver_type == 'hr_manager':
            employee = getattr(entity, 'employee', None)
            if employee and employee.hr_manager:
                return employee.hr_manager
                
        elif step.approver_type == 'user':
            return step.approver_user
            
        elif step.approver_type == 'role':
            # Simple implementation: pick first employee with this role in the same department
            # Real implementation might be more complex
            employee = getattr(entity, 'employee', None)
            if employee:
                approver = Employee.objects.filter(
                    user__roles=step.approver_role,
                    department=employee.department,
                    is_active=True
                ).first()
                return approver

        return None

    @staticmethod
    @transaction.atomic
    def take_action(instance, actor, action, comments=''):
        """
        Record an action (Approve/Reject) and transition the workflow.
        """
        if instance.status != 'in_progress':
            raise ValueError("Workflow instance is not in progress.")

        # Record the action
        WorkflowAction.objects.create(
            instance=instance,
            step=instance.current_step,
            actor=actor,
            action=action,
            comments=comments,
            organization=instance.organization
        )

        if action == 'rejected':
            instance.status = 'rejected'
            instance.completed_at = timezone.now()
            instance.save()
            # Callback to entity could be added here
            return instance

        # Move to next step
        next_step = instance.workflow.workflow_steps.filter(order=instance.current_step + 1).first()
        
        if next_step:
            instance.current_step += 1
            instance.current_approver = WorkflowService.get_approver_for_step(
                next_step, 
                # In real app, we'd fetch the actual entity object here
                None, 
                actor
            )
            instance.save()
        else:
            # No more steps - Mark as Approved
            instance.status = 'approved'
            instance.completed_at = timezone.now()
            instance.current_approver = None
            instance.save()
            
        return instance

    @staticmethod
    @transaction.atomic
    def escalate_workflow(instance, actor, reason, escalate_to_id=None):
        """
        Manually escalate a workflow instance to a higher authority.
        """
        if instance.status != 'in_progress':
            raise ValueError("Only in-progress workflows can be escalated")
        
        current_step = instance.workflow.workflow_steps.filter(order=instance.current_step).first()
        
        if escalate_to_id:
            try:
                escalate_to = Employee.objects.get(id=escalate_to_id)
            except Employee.DoesNotExist:
                raise ValueError("Escalation target employee not found")
        else:
            if current_step and current_step.escalate_to:
                escalate_to_step = current_step.escalate_to
                escalate_to = WorkflowService.get_approver_for_step(escalate_to_step, None, actor)
            else:
                current_approver = instance.current_approver
                if current_approver and current_approver.reporting_manager:
                    escalate_to = current_approver.reporting_manager
                else:
                    raise ValueError("No escalation target available")
        
        if not escalate_to:
            raise ValueError("Could not determine escalation target")
        
        WorkflowAction.objects.create(
            instance=instance,
            step=instance.current_step,
            actor=actor,
            action='escalated',
            comments=f"Escalated: {reason}",
            organization=instance.organization
        )
        
        instance.status = 'escalated'
        instance.current_approver = escalate_to
        instance.save()
        
        return instance

    @staticmethod
    @transaction.atomic
    def process_parallel_approval(instance, actor, action, comments=''):
        """
        Process parallel approval - multiple approvers can act on the same step.
        All approvers must approve for the step to pass (AND logic).
        Any rejection fails the entire workflow.
        """
        if instance.status != 'in_progress':
            raise ValueError("Workflow instance is not in progress.")
        
        current_step = instance.workflow.workflow_steps.filter(order=instance.current_step).first()
        if not current_step:
            raise ValueError("Current step not found")
        
        existing_action = WorkflowAction.objects.filter(
            instance=instance,
            step=instance.current_step,
            actor=actor
        ).first()
        
        if existing_action:
            raise ValueError("You have already taken action on this step")
        
        WorkflowAction.objects.create(
            instance=instance,
            step=instance.current_step,
            actor=actor,
            action=action,
            comments=comments,
            organization=instance.organization
        )
        
        if action == 'rejected':
            instance.status = 'rejected'
            instance.completed_at = timezone.now()
            instance.save()
            return instance
        
        step_config = instance.workflow.conditions.get('parallel_steps', {})
        required_approvers = step_config.get(str(instance.current_step), {}).get('required_approvers', 1)
        
        approval_count = WorkflowAction.objects.filter(
            instance=instance,
            step=instance.current_step,
            action='approved'
        ).count()
        
        if approval_count >= required_approvers:
            next_step = instance.workflow.workflow_steps.filter(order=instance.current_step + 1).first()
            
            if next_step:
                instance.current_step += 1
                instance.current_approver = WorkflowService.get_approver_for_step(next_step, None, actor)
                instance.save()
            else:
                instance.status = 'approved'
                instance.completed_at = timezone.now()
                instance.current_approver = None
                instance.save()
        
        return instance
