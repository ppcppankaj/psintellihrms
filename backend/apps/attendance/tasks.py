"""
Attendance Tasks
SECURITY: Tenant enforced
"""

from celery import shared_task
from apps.core.celery_tasks import TenantAwareTask
from apps.attendance.models import AttendanceRecord


@shared_task(bind=True)
def recalculate_attendance(self, organization_id: str, date: str):
    """
    Recalculate attendance for one organization.
    """

    organization = TenantAwareTask.get_organization(organization_id)

    records = AttendanceRecord.objects.filter(
        organization=organization,
        attendance_date=date
    )

    for record in records:
        record.recalculate()
