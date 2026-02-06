"""
Celery Configuration for HRMS with Organization-Based Context
CRITICAL: All tasks execute within an organization context
"""

import os
import logging
from celery import Celery, signals
from celery.signals import task_prerun, task_postrun, before_task_publish
from django.db import connection

logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('hrms')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


# CRITICAL: Organization context propagation for Celery tasks
@before_task_publish.connect
def before_task_publish_handler(sender=None, headers=None, body=None, **kwargs):
    """
    Capture current organization before task is published to broker.
    """
    try:
        from apps.core.context import get_current_organization
        org = get_current_organization()
        
        if org:
            # Inject organization info into task headers
            headers['organization_id'] = str(org.id)
            headers['organization_name'] = org.name
            logger.debug(f"Task {sender} published with organization: {org.name}")
        else:
            headers['organization_id'] = None
            logger.debug(f"Task {sender} published without organization context")
    except Exception as e:
        logger.error(f"Failed to capture organization context for task {sender}: {e}")
        headers['organization_id'] = None


@task_prerun.connect
def task_prerun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, **extra):
    """
    Restore organization context BEFORE task execution.
    """
    try:
        # Extract organization info from task headers
        task_headers = task.request.headers or {}
        organization_id = task_headers.get('organization_id')
        
        if not organization_id:
            logger.debug(f"Task {task.name} [{task_id}] running without organization context")
        else:
            from apps.core.models import Organization
            from apps.core.context import set_current_organization
            
            try:
                org = Organization.objects.get(id=organization_id, is_active=True)
                # Store in context
                set_current_organization(org)
                
                logger.info(
                    f"✓ Task {task.name} [{task_id}] running for organization: {org.name}"
                )
            except Organization.DoesNotExist:
                logger.error(
                    f"Task {task.name} [{task_id}] failed: Organization {organization_id} not found!"
                )
                raise RuntimeError(f"Organization {organization_id} not found or inactive")
    
    except Exception as e:
        logger.error(f"Failed to set organization context for task {task.name} [{task_id}]: {e}")


@task_postrun.connect
def task_postrun_handler(sender=None, task_id=None, task=None, **kwargs):
    """
    Cleanup after task execution.
    """
    try:
        from apps.core.context import set_current_organization
        set_current_organization(None)
        logger.debug(f"Task {task.name} [{task_id}] cleanup complete")
    except Exception as e:
        logger.error(f"Task cleanup failed for {task.name} [{task_id}]: {e}")


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to test organization context"""
    from apps.core.context import get_current_organization
    org = get_current_organization()
    
    print(f'Request: {self.request!r}')
    print(f'Current organization: {org.name if org else "None"}')

