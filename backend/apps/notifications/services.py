"""
Notification Services - In-app and Multi-channel notifications
"""

from django.utils import timezone
from .models import Notification

class NotificationService:
    """
    Service to handle creation and delivery of notifications.
    """

    @staticmethod
    def notify(user, title, message, notification_type='info', entity_type=None, entity_id=None, priority='medium'):
        """
        Create an in-app notification. 
        Email/SMS logic can be added here.
        """
        # Resolve User -> Employee
        # Handle case where user might be lazy object or user has no employee profile
        try:
            recipient = getattr(user, 'employee', None)
        except Exception:
            recipient = None
            
        if not recipient:
            # Cannot create notification for user without employee profile
            return None

        notification = Notification.objects.create(
            recipient=recipient,
            subject=title,
            body=message,
            channel='in_app',
            entity_type=entity_type or '',
            entity_id=entity_id,
        )
        
        # Email logic would be triggered here (e.g., via Celery)
        # cls._send_email(user.email, title, message)
        
        return notification

    @staticmethod
    def mark_all_as_read(user):
        """
        Mark all notifications for a user as read.
        """
        return Notification.objects.filter(recipient__user=user, is_read=False).update(
            status='read', 
            read_at=timezone.now()
        )

    @classmethod
    def send_template_notification(cls, user, template_code, context=None, entity_type=None, entity_id=None, priority='medium'):
        """
        Send a notification using a defined template.
        """
        from .models import NotificationTemplate
        context = context or {}
        
        try:
            # Fetch template - in real app, filter by tenant if needed
            template = NotificationTemplate.objects.get(code=template_code)
        except NotificationTemplate.DoesNotExist:
            print(f"Template {template_code} not found")
            return None
            
        # Basic jinja2-style variable replacement
        subject = template.subject
        body = template.body
        
        for key, value in context.items():
            placeholder = f"{{{{ {key} }}}}"
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))
            
        return cls.notify(
            user=user, 
            title=subject, 
            message=body, 
            notification_type='info', 
            entity_type=entity_type, 
            entity_id=entity_id, 
            priority=priority,
            channel=template.channel
        )

    @staticmethod
    def notify(user, title, message, notification_type='info', entity_type=None, entity_id=None, priority='medium', channel='in_app'):
        """
        Create an in-app notification. 
        Email/SMS logic can be added here.
        """
        # Resolve User -> Employee
        # Handle case where user might be lazy object or user has no employee profile
        try:
            recipient = getattr(user, 'employee', None)
        except Exception:
            recipient = None
            
        if not recipient:
            # Cannot create notification for user without employee profile
            return None

        notification = Notification.objects.create(
            recipient=recipient,
            subject=title,
            body=message,
            channel=channel,
            entity_type=entity_type or '',
            entity_id=entity_id,
        )
        
        # Email logic would be triggered here (e.g., via Celery)
        # cls._send_email(user.email, title, message)
        
        return notification

    @staticmethod
    def mark_as_read(notification_id):
        """Mark a single notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.status = 'read'
            notification.read_at = timezone.now()
            notification.save(update_fields=['status', 'read_at'])
            return True
        except Notification.DoesNotExist:
            return False

    @staticmethod
    def send_push_notifications(recipient_ids, title, body, data=None, priority='normal'):
        """
        Send push notifications to specified recipients.
        This is a stub implementation - integrate with actual push service
        (Firebase FCM, OneSignal, AWS SNS, etc.)
        """
        from apps.employees.models import Employee
        
        data = data or {}
        results = {
            'sent': [],
            'failed': [],
            'message': 'Push notification stub - integrate with FCM/OneSignal for production'
        }
        
        employees = Employee.objects.filter(id__in=recipient_ids, is_active=True)
        
        for employee in employees:
            notification = Notification.objects.create(
                recipient=employee,
                subject=title,
                body=body,
                channel='push',
                status='pending',
            )
            results['sent'].append({
                'employee_id': str(employee.id),
                'notification_id': str(notification.id),
                'status': 'queued'
            })
        
        not_found = set(str(rid) for rid in recipient_ids) - set(str(e.id) for e in employees)
        for rid in not_found:
            results['failed'].append({
                'employee_id': rid,
                'error': 'Employee not found or inactive'
            })
        
        return results

    @staticmethod
    def send_digest(digest_type='daily', recipient_ids=None):
        """
        Send digest notifications - batch of unread notifications.
        Can be called by scheduler for daily/weekly digests.
        """
        from apps.employees.models import Employee
        from datetime import timedelta
        
        results = {
            'processed': 0,
            'notifications_sent': 0,
            'digest_type': digest_type
        }
        
        if digest_type == 'daily':
            cutoff = timezone.now() - timedelta(days=1)
        else:
            cutoff = timezone.now() - timedelta(weeks=1)
        
        if recipient_ids:
            employees = Employee.objects.filter(id__in=recipient_ids, is_active=True)
        else:
            employees = Employee.objects.filter(
                is_active=True,
                user__notification_prefs__email_enabled=True
            ).distinct()
        
        for employee in employees:
            unread_notifications = Notification.objects.filter(
                recipient=employee,
                created_at__gte=cutoff
            ).exclude(status='read').order_by('-created_at')
            
            if unread_notifications.exists():
                count = unread_notifications.count()
                subjects = list(unread_notifications.values_list('subject', flat=True)[:5])
                
                digest_body = f"You have {count} unread notification(s):\n"
                for subject in subjects:
                    digest_body += f"- {subject}\n"
                if count > 5:
                    digest_body += f"...and {count - 5} more"
                
                Notification.objects.create(
                    recipient=employee,
                    subject=f"{digest_type.title()} Digest: {count} notifications",
                    body=digest_body,
                    channel='email',
                    status='pending',
                )
                
                results['notifications_sent'] += 1
            
            results['processed'] += 1
        
        return results
