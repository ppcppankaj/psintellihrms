"""
Leave Celery Tasks - Scheduled accrual and notifications
"""

from celery import shared_task
from django.utils import timezone


@shared_task
def run_monthly_accrual():
    """
    Run monthly leave accrual for all organizations.
    Scheduled to run on 1st of each month.
    """
    from apps.leave.services import LeaveBalanceService
    from apps.core.models import Organization
    from apps.core.context import set_current_organization
    
    organizations = Organization.objects.filter(is_active=True)
    
    for org in organizations:
        set_current_organization(org)
        try:
            LeaveBalanceService.run_monthly_accrual()
        except Exception as e:
            # Log error but continue with other organizations
            print(f"Accrual failed for {org.name}: {e}")
    
    set_current_organization(None)
    return f"Accrual completed for {organizations.count()} organizations"


@shared_task
def run_year_end_carryforward():
    """
    Run year-end carry forward for all organizations.
    Scheduled to run on January 1st.
    """
    from apps.leave.services import LeaveBalanceService
    from apps.core.models import Organization
    from apps.core.context import set_current_organization
    
    current_year = timezone.now().year
    previous_year = current_year - 1
    
    organizations = Organization.objects.filter(is_active=True)
    
    for org in organizations:
        set_current_organization(org)
        try:
            LeaveBalanceService.run_year_end_carryforward(previous_year, current_year)
        except Exception as e:
            print(f"Carry forward failed for {org.name}: {e}")
            
    set_current_organization(None)
    return f"Carry forward completed for {organizations.count()} organizations"


@shared_task
def send_leave_reminder():
    """
    Send reminder to approvers for pending leave requests.
    Runs daily.
    """
    from apps.leave.models import LeaveRequest
    from apps.core.models import Organization
    from apps.core.context import set_current_organization
    from datetime import timedelta
    
    cutoff = timezone.now() - timedelta(days=2)  # Pending for 2+ days
    
    organizations = Organization.objects.filter(is_active=True)
    
    for org in organizations:
        set_current_organization(org)
        pending = LeaveRequest.objects.filter(
            status=LeaveRequest.STATUS_PENDING,
            created_at__lt=cutoff,
            current_approver__isnull=False
        ).select_related('current_approver', 'employee')
        
        for leave in pending:
            # Send notification to approver
            from apps.notifications.services import NotificationService
            
            if leave.current_approver:
                NotificationService.notify(
                    user=leave.current_approver.user,
                    title='Leave Request Pending Approval',
                    message=f'Leave request from {leave.employee} for {leave.start_date} to {leave.end_date} is pending your approval',
                    notification_type='warning',
                    entity_type='leave_request',
                    entity_id=leave.id
                )
            
    set_current_organization(None)
    return "Reminders sent"


@shared_task
def process_leave_escalation():
    """
    Escalate pending leave requests after timeout.
    Runs daily.
    """
    from apps.leave.models import LeaveRequest
    from apps.leave.services import LeaveApprovalService
    from apps.core.models import Organization
    from apps.core.context import set_current_organization
    from datetime import timedelta
    
    # Escalate if pending for more than 3 days
    escalation_cutoff = timezone.now() - timedelta(days=3)
    
    organizations = Organization.objects.filter(is_active=True)
    
    for org in organizations:
        set_current_organization(org)
        pending = LeaveRequest.objects.filter(
            status=LeaveRequest.STATUS_PENDING,
            created_at__lt=escalation_cutoff,
            current_approver__isnull=False
        )
        
        for leave in pending:
            # Get next level approver
            current_level = leave.approvals.count() + 1
            next_approver = LeaveApprovalService.get_approver(
                leave.employee, level=current_level + 1
            )
            
            if next_approver:
                leave.current_approver = next_approver
                leave.save()
                
                # Send escalation notification
                from apps.notifications.services import NotificationService
                NotificationService.notify(
                    user=next_approver.user,
                    title='Leave Request Escalated',
                    message=f'Leave request from {leave.employee} has been escalated to you for approval',
                    notification_type='warning',
                    entity_type='leave_request',
                    entity_id=leave.id
                )
                
    set_current_organization(None)
    return "Escalations processed"
