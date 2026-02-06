"""
Notification Tasks
SECURITY: Tenant scoped
"""

from celery import shared_task
from apps.core.celery_tasks import TenantAwareTask
from apps.notifications.models import Notification


@shared_task(bind=True)
def send_notification(self, organization_id: str, notification_id: str):
    organization = TenantAwareTask.get_organization(organization_id)

    notification = Notification.objects.filter(
        id=notification_id,
        organization=organization
    ).first()

    if not notification:
        return

    notification.send()
