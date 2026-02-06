"""
Payroll Background Tasks
SECURITY: Tenant-isolated Celery tasks
"""

from celery import shared_task
from apps.core.celery_tasks import TenantAwareTask
from apps.payroll.models import PayrollRun


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3},
    retry_backoff=True
)
def generate_payroll(self, organization_id: str, payroll_run_id: str):
    """
    Generate payroll for a specific organization only.

    🔒 SECURITY GUARANTEES:
    - Explicit org_id
    - Org filtering enforced
    - Cross-tenant access impossible
    """

    # 🔒 Resolve organization safely
    organization = TenantAwareTask.get_organization(organization_id)

    payroll_run = PayrollRun.objects.filter(
        id=payroll_run_id,
        organization=organization
    ).first()

    if not payroll_run:
        # Silent exit — prevents data leaks
        return

    # ===============================
    # BUSINESS LOGIC STARTS HERE
    # ===============================

    payroll_run.status = PayrollRun.Status.PROCESSING
    payroll_run.save(update_fields=['status'])

    # ... payroll calculations ...

    payroll_run.status = PayrollRun.Status.COMPLETED
    payroll_run.save(update_fields=['status'])
