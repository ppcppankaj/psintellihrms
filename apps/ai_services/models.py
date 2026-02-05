"""AI Models"""
from django.db import models
from apps.core.models import OrganizationEntity


class AIModelVersion(OrganizationEntity):
    """AI model versioning"""
    name = models.CharField(max_length=100)
    model_type = models.CharField(max_length=50)  # resume_parser, attrition, burnout, etc.
    version = models.CharField(max_length=20)
    model_path = models.CharField(max_length=500)
    is_active = models.BooleanField(default=False)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} v{self.version}"


class AIPrediction(OrganizationEntity):
    """AI prediction log"""
    model_version = models.ForeignKey(AIModelVersion, on_delete=models.SET_NULL, null=True)
    entity_type = models.CharField(max_length=50)
    entity_id = models.UUIDField()
    
    prediction = models.JSONField()
    confidence = models.DecimalField(max_digits=5, decimal_places=2)
    
    human_reviewed = models.BooleanField(default=False)
    human_override = models.JSONField(null=True, blank=True)
    reviewed_by = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.entity_type}:{self.entity_id} - {self.confidence}%"
