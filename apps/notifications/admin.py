from django.contrib import admin
from apps.core.admin_mixins import OrganizationAwareAdminMixin
from .models import NotificationTemplate, Notification


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(OrganizationAwareAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'code', 'channel', 'is_active']
    list_filter = ['channel', 'is_active']
    search_fields = ['name', 'code']


@admin.register(Notification)
class NotificationAdmin(OrganizationAwareAdminMixin, admin.ModelAdmin):
    list_display = ['recipient', 'channel', 'subject', 'status', 'sent_at', 'read_at']
    list_filter = ['status', 'channel']
    search_fields = ['recipient__employee_id', 'subject']
    raw_id_fields = ['recipient', 'template']
