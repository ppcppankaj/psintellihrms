"""Notification Models"""
from django.db import models
from apps.core.models import OrganizationEntity


class NotificationTemplate(OrganizationEntity):
    """Notification template"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    
    subject = models.CharField(max_length=255)
    body = models.TextField()
    
    channel = models.CharField(max_length=20, choices=[
        ('email', 'Email'), ('sms', 'SMS'), ('push', 'Push'),
        ('whatsapp', 'WhatsApp'), ('slack', 'Slack'), ('teams', 'Teams')
    ])
    
    variables = models.JSONField(default=list, blank=True)  # e.g., ['employee_name', 'leave_type']
    
    class Meta:
        ordering = ['name']
        unique_together = ('organization', 'code')
    
    def __str__(self):
        return f"{self.name} ({self.channel})"


class NotificationPreference(OrganizationEntity):
    """User notification preferences"""
    user = models.OneToOneField(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='notification_prefs'  # Changed to avoid conflict with User.notification_preferences JSONField
    )
    
    # Channel preferences
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    
    # Notification type preferences
    leave_notifications = models.BooleanField(default=True)
    attendance_notifications = models.BooleanField(default=True)
    payroll_notifications = models.BooleanField(default=True)
    task_notifications = models.BooleanField(default=True)
    announcement_notifications = models.BooleanField(default=True)
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user}"


class Notification(OrganizationEntity):
    """Notification record"""
    recipient = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='notifications')
    
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    channel = models.CharField(max_length=20)
    
    subject = models.CharField(max_length=255)
    body = models.TextField()
    
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'), ('sent', 'Sent'), ('delivered', 'Delivered'),
        ('read', 'Read'), ('failed', 'Failed')
    ], default='pending')
    
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Reference to entity
    entity_type = models.CharField(max_length=50, blank=True)
    entity_id = models.UUIDField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.recipient.employee_id} - {self.subject[:50]}"
