"""
Notification Serializers
"""

from rest_framework import serializers
from .models import Notification, NotificationTemplate, NotificationPreference


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'organization', 'name', 'code', 'subject', 'body',
            'channel', 'variables', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    template_details = NotificationTemplateSerializer(source='template', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'organization', 'recipient', 'template', 'template_details',
            'channel', 'subject', 'body', 'status', 'sent_at', 'read_at',
            'entity_type', 'entity_id', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'read_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for user notification preferences"""
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'organization', 'user',
            'email_enabled', 'push_enabled', 'sms_enabled',
            'leave_notifications', 'attendance_notifications',
            'payroll_notifications', 'task_notifications', 'announcement_notifications',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class PushNotificationSerializer(serializers.Serializer):
    """Serializer for sending push notifications"""
    recipient_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of employee IDs to receive notification"
    )
    title = serializers.CharField(max_length=255)
    body = serializers.CharField()
    data = serializers.DictField(required=False, default=dict)
    priority = serializers.ChoiceField(
        choices=['low', 'normal', 'high'],
        default='normal'
    )


class SendDigestSerializer(serializers.Serializer):
    """Serializer for sending digest notifications"""
    digest_type = serializers.ChoiceField(
        choices=['daily', 'weekly'],
        default='daily'
    )
    recipient_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="Optional list of employee IDs. If empty, sends to all eligible users."
    )
