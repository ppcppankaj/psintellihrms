"""
Core Models - Base classes for all HRMS models
Hierarchical Multi-Tenancy: Organization → User → Branch
"""

import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from .context import get_current_organization
import logging

logger = logging.getLogger(__name__)


class TimeStampedModel(models.Model):
    """Abstract base model with timestamps"""
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


# ============================================================================
# ORGANIZATION MODEL - Core Multi-Tenancy
# ============================================================================

class Organization(models.Model):
    """
    Organization model - core entity for multi-tenancy.
    One organization = one company using the HRMS.
    
    CRITICAL: id (UUID) is the ONLY isolation key.
    Slug is for display/branding only, NOT for security.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="UUID - the ONLY key used for data isolation"
    )
    
    # Basic Info
    name = models.CharField(max_length=255, db_index=True)
    logo = models.ImageField(upload_to='organizations/logos/', null=True, blank=True)
    
    # Contact Information
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Business Settings
    timezone = models.CharField(max_length=100, default='Asia/Kolkata')
    currency = models.CharField(max_length=3, default='INR')
    
    # Subscription & Status
    subscription_status = models.CharField(
        max_length=20,
        choices=[
            ('trial', 'Trial'),
            ('active', 'Active'),
            ('past_due', 'Past Due'),
            ('cancelled', 'Cancelled'),
            ('suspended', 'Suspended'),
        ],
        default='trial',
        db_index=True
    )
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations'
        ordering = ['name']
        indexes = [
            models.Index(fields=['subscription_status', 'is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def clean(self):
        """Validate organization data"""
        if not self.name or not self.name.strip():
            raise ValidationError("Organization name is required")


# ============================================================================
# ORGANIZATION-BASED MANAGER - Auto-filters by organization context
# ============================================================================

class OrganizationManager(models.Manager):
    """
    Manager that automatically filters queries by current organization context.
    
    PRODUCTION SAFETY: Raises RuntimeError if organization context is missing
    in production to prevent accidental data leakage across organizations.
    """
    
    def get_queryset(self):
        """Filter all queries by current organization context"""
        qs = super().get_queryset()
        org = get_current_organization()
        
        if org is None:
            # PRODUCTION SAFETY CHECK
            if getattr(settings, 'ENVIRONMENT', 'development') == 'production' and \
               getattr(settings, 'REQUIRE_ORGANIZATION_CONTEXT', True):
                raise RuntimeError(
                    "Organization context is required in production. "
                    "All queries must have organization set via middleware or explicitly."
                )
            # In development, return unfiltered queryset for debugging
            logger.warning("No organization context set - returning unfiltered queryset")
            return qs
        
        return qs.filter(organization_id=org.id)
    
    def all_organizations(self):
        """Get objects from all organizations (admin/reporting use only)"""
        return super().get_queryset()


# ============================================================================
# ORGANIZATION ENTITY - Base class for all organization-scoped models
# ============================================================================

class SoftDeleteManager(models.Manager):
    """Manager that filters out soft-deleted objects"""
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def all_with_deleted(self):
        return super().get_queryset()
    
    def deleted_only(self):
        return super().get_queryset().filter(is_deleted=True)


class SoftDeleteModel(models.Model):
    """Abstract model with soft delete capability"""
    
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_deleted'
    )
    
    objects = SoftDeleteManager()
    all_objects = models.Manager()
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False, hard_delete=False):
        if hard_delete:
            return super().delete(using=using, keep_parents=keep_parents)
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])
    
    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])


class AuditModel(models.Model):
    """Abstract model with audit fields"""
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated'
    )
    
    class Meta:
        abstract = True


class EnterpriseModel(TimeStampedModel, SoftDeleteModel, AuditModel):
    """
    Base model for all enterprise entities.
    Includes: UUID PK, timestamps, soft delete, audit fields
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_active = models.BooleanField(default=True, db_index=True)
    
    class Meta:
        abstract = True
    
    def __str__(self):
        return str(self.id)


class OrganizationEntity(EnterpriseModel):
    """
    🏢 Organization Entity - Base class for all organization-scoped models.
    Replaces legacy OrganizationEntity.
    """
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True,
        help_text="Organization this record belongs to (primary isolation key)"
    )
    
    objects = OrganizationManager()
    all_objects = models.Manager()
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['organization', 'created_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.organization_id:
            from .context import get_current_organization
            org = get_current_organization()
            if org:
                self.organization = org
            elif not self._state.adding:
                 pass
            else:
                 if getattr(settings, 'ENVIRONMENT', 'development') == 'production':
                     raise ValidationError("Organization context missing")
        
        super().save(*args, **kwargs)

# Legacy Alias
OrganizationEntity = OrganizationEntity


class HistoricalModel(models.Model):
    """Abstract model for tracking historical changes"""
    
    version = models.PositiveIntegerField(default=1)
    history_date = models.DateTimeField(auto_now_add=True)
    history_type = models.CharField(
        max_length=1,
        choices=[
            ('+', 'Created'),
            ('~', 'Changed'),
            ('-', 'Deleted'),
        ]
    )
    history_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    
    class Meta:
        abstract = True


class TaggableModel(models.Model):
    """Abstract model for entities that can have tags"""
    
    tags = models.JSONField(default=list, blank=True)
    
    class Meta:
        abstract = True
    
    def add_tag(self, tag):
        if tag not in self.tags:
            self.tags.append(tag)
            self.save(update_fields=['tags'])
    
    def remove_tag(self, tag):
        if tag in self.tags:
            self.tags.remove(tag)
            self.save(update_fields=['tags'])


class MetadataModel(models.Model):
    """Abstract model for storing arbitrary metadata"""
    
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        abstract = True
    
    def set_metadata(self, key, value):
        self.metadata[key] = value
        self.save(update_fields=['metadata'])
    
    def get_metadata(self, key, default=None):
        return self.metadata.get(key, default)


class OrderedModel(models.Model):
    """Abstract model for orderable items"""
    
    order = models.PositiveIntegerField(default=0, db_index=True)
    
    class Meta:
        abstract = True
        ordering = ['order']


class AuditLog(models.Model):
    """System-wide audit log for tracking all changes"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # User info
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    user_email = models.EmailField(null=True, blank=True)
    
    # Action info
    action = models.CharField(max_length=50, db_index=True)
    resource_type = models.CharField(max_length=100, db_index=True)
    resource_id = models.CharField(max_length=100, db_index=True)
    resource_repr = models.CharField(max_length=255, null=True, blank=True)
    
    # Change data
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    changed_fields = models.JSONField(default=list, blank=True)
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    request_id = models.CharField(max_length=100, null=True, blank=True)
    
    # Organization context
    organization_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['organization_id', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]
    
    def __str__(self):
        return f"{self.action} {self.resource_type} by {self.user_email}"


class Announcement(OrganizationEntity):
    """Organization-wide announcements"""
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    
    target_all = models.BooleanField(default=True)
    target_departments = models.JSONField(default=list, blank=True)
    target_branches = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-is_pinned', '-published_at']
        indexes = [
            models.Index(fields=['organization', 'is_published', '-published_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def is_visible(self):
        if not self.is_published:
            return False
        now = timezone.now()
        if self.expires_at and now > self.expires_at:
            return False
        return True


class OrganizationSettings(OrganizationEntity):
    """Organization-level settings and preferences"""
    
    DATE_FORMAT_CHOICES = [
        ('YYYY-MM-DD', 'YYYY-MM-DD'),
        ('DD/MM/YYYY', 'DD/MM/YYYY'),
        ('MM/DD/YYYY', 'MM/DD/YYYY'),
        ('DD-MM-YYYY', 'DD-MM-YYYY'),
    ]
    
    TIME_FORMAT_CHOICES = [
        ('12h', '12-hour'),
        ('24h', '24-hour'),
    ]
    
    date_format = models.CharField(max_length=20, choices=DATE_FORMAT_CHOICES, default='YYYY-MM-DD')
    time_format = models.CharField(max_length=5, choices=TIME_FORMAT_CHOICES, default='24h')
    week_start_day = models.PositiveSmallIntegerField(default=0)
    
    enable_geofencing = models.BooleanField(default=False)
    enable_face_recognition = models.BooleanField(default=False)
    enable_biometric = models.BooleanField(default=False)
    
    leave_approval_levels = models.PositiveSmallIntegerField(default=1)
    expense_approval_levels = models.PositiveSmallIntegerField(default=1)
    
    probation_period_days = models.PositiveIntegerField(default=90)
    notice_period_days = models.PositiveIntegerField(default=30)
    
    payroll_cycle_day = models.PositiveSmallIntegerField(default=1)
    enable_auto_payroll = models.BooleanField(default=False)
    
    branding_primary_color = models.CharField(max_length=7, default='#1976d2')
    branding_secondary_color = models.CharField(max_length=7, default='#dc004e')
    
    custom_settings = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name_plural = 'Organization Settings'
    
    def __str__(self):
        return f"Settings for {self.organization}"
    
    @classmethod
    def get_for_organization(cls, organization):
        settings, _ = cls.objects.get_or_create(organization=organization)
        return settings


class FeatureFlag(models.Model):
    """Feature flags for controlling feature availability"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_enabled = models.BooleanField(default=False)
    
    # Targeting
    enabled_for_all = models.BooleanField(default=False)
    enabled_organizations = models.JSONField(default=list, blank=True)
    enabled_users = models.JSONField(default=list, blank=True)
    enabled_percentage = models.PositiveIntegerField(default=0)  # 0-100
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def is_enabled_for(self, organization_id=None, user_id=None):
        if not self.is_enabled:
            return False
        if self.enabled_for_all:
            return True
        if organization_id and str(organization_id) in self.enabled_organizations:
            return True
        if user_id and str(user_id) in self.enabled_users:
            return True
        return False
