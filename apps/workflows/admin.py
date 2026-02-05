"""Workflows Admin"""
from django.contrib import admin
from .models import WorkflowDefinition, WorkflowStep, WorkflowInstance, WorkflowAction


@admin.register(WorkflowDefinition)
class WorkflowDefinitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'entity_type', 'sla_hours', 'is_active']
    list_filter = ['entity_type', 'is_active']
    search_fields = ['name', 'code']


@admin.register(WorkflowStep)
class WorkflowStepAdmin(admin.ModelAdmin):
    list_display = ['workflow', 'order', 'name', 'approver_type', 'is_optional']
    list_filter = ['workflow', 'approver_type']
    ordering = ['workflow', 'order']


@admin.register(WorkflowInstance)
class WorkflowInstanceAdmin(admin.ModelAdmin):
    list_display = ['workflow', 'entity_type', 'entity_id', 'current_step', 'status', 'started_at']
    list_filter = ['status', 'entity_type']
    raw_id_fields = ['workflow', 'current_approver']


@admin.register(WorkflowAction)
class WorkflowActionAdmin(admin.ModelAdmin):
    list_display = ['instance', 'step', 'actor', 'action', 'created_at']
    list_filter = ['action']
    raw_id_fields = ['instance', 'actor']
