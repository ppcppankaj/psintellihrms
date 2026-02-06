"""Workflow Models - Multi-level Approval Workflow Engine"""
from django.db import models
from apps.core.models import OrganizationEntity


class WorkflowDefinition(OrganizationEntity):
    """Workflow definition/template"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    entity_type = models.CharField(max_length=50)  # leave_request, expense_claim, etc.
    
    # Workflow configuration as JSON
    steps = models.JSONField(default=list)
    conditions = models.JSONField(default=dict, blank=True)
    
    # SLA
    sla_hours = models.PositiveIntegerField(null=True, blank=True)
    auto_approve_on_sla = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class WorkflowStep(OrganizationEntity):
    """Step in a workflow"""
    workflow = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='workflow_steps')
    
    order = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=100)
    
    approver_type = models.CharField(max_length=30, choices=[
        ('reporting_manager', 'Reporting Manager'),
        ('hr_manager', 'HR Manager'),
        ('department_head', 'Department Head'),
        ('role', 'Specific Role'),
        ('user', 'Specific User'),
    ])
    approver_role = models.ForeignKey('abac.Role', on_delete=models.SET_NULL, null=True, blank=True)
    approver_user = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True)
    
    is_optional = models.BooleanField(default=False)
    can_delegate = models.BooleanField(default=True)
    
    sla_hours = models.PositiveIntegerField(null=True, blank=True)
    escalate_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='escalations')
    
    class Meta:
        ordering = ['workflow', 'order']
        unique_together = ['workflow', 'order']
    
    def __str__(self):
        return f"{self.workflow.name} - Step {self.order}: {self.name}"


class WorkflowInstance(OrganizationEntity):
    """Instance of a workflow for a specific entity"""
    workflow = models.ForeignKey(WorkflowDefinition, on_delete=models.SET_NULL, null=True, related_name='instances')
    
    entity_type = models.CharField(max_length=50)
    entity_id = models.UUIDField()
    
    current_step = models.PositiveSmallIntegerField(default=1)
    
    status = models.CharField(max_length=20, choices=[
        ('in_progress', 'In Progress'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('escalated', 'Escalated'),
    ], default='in_progress')
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    current_approver = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.entity_type}:{self.entity_id} - {self.status}"


class WorkflowAction(OrganizationEntity):
    """Action taken in a workflow instance"""
    instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='actions')
    step = models.PositiveSmallIntegerField()
    
    actor = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True)
    
    action = models.CharField(max_length=20, choices=[
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('forwarded', 'Forwarded'),
        ('delegated', 'Delegated'),
        ('escalated', 'Escalated'),
    ])
    
    comments = models.TextField(blank=True)
    
    class Meta:
        ordering = ['instance', 'step', 'created_at']
    
    def __str__(self):
        return f"{self.instance} - Step {self.step}: {self.action}"
