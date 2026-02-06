"""
Organization-Based Multi-Tenancy Implementation
Complete working examples for reference during migration
"""

# =============================================================================
# 1. CORE MODELS (apps/core/models.py)
# =============================================================================

import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from contextvars import ContextVar

# Context variables (async-safe, unlike threading.local)
current_organization_var = ContextVar('current_organization', default=None)
current_user_var = ContextVar('current_user', default=None)


def get_current_organization():
    """Get current organization from context (async-safe)"""
    return current_organization_var.get()


def set_current_organization(organization):
    """Set current organization in context (async-safe)"""
    current_organization_var.set(organization)


class Organization(models.Model):
    """
    Main organization model - replaces Tenant
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Info
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="URL-friendly identifier for branding/display ONLY. NOT used for tenant isolation."
    )
    logo = models.ImageField(upload_to='organizations/logos/', null=True, blank=True)
    
    # Contact
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Business Settings
    timezone = models.CharField(max_length=100, default='Asia/Kolkata')
    currency = models.CharField(max_length=3, default='INR')
    date_format = models.CharField(max_length=20, default='DD/MM/YYYY')
    
    # Subscription
    subscription_status = models.CharField(
        max_length=20,
        choices=[
            ('trial', 'Trial'),
            ('active', 'Active'),
            ('suspended', 'Suspended'),
            ('cancelled', 'Cancelled'),
        ],
        default='trial',
        db_index=True
    )
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    subscription_ends_at = models.DateTimeField(null=True, blank=True)
    
    # Feature toggles
    features = models.JSONField(default=dict, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'core_organization'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug', 'is_active']),
            models.Index(fields=['subscription_status', 'is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def has_feature(self, feature_name: str) -> bool:
        """Check if organization has access to a feature"""
        return self.features.get(feature_name, False)


class OrganizationManager(models.Manager):
    """
    Manager that automatically filters by current organization.
    CRITICAL: Raises error in production if organization context is missing.
    """
    def get_queryset(self):
        qs = super().get_queryset()
        org = get_current_organization()
        
        if org is not None:
            return qs.filter(organization=org)
        
        # SAFETY CHECK: In production, missing org context is a bug
        if not settings.DEBUG and settings.ENVIRONMENT == 'production':
            raise RuntimeError(
                f"CRITICAL: Organization context missing for {self.model.__name__} query. "
                "This could cause data leakage. Use .all_objects if intentional."
            )
        
        # In development, management commands, or Celery tasks without context
        # Allow unrestricted access (but log warning)
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(
            f"Query on {self.model.__name__} without organization context. "
            f"Use .all_objects if intentional."
        )
        return qs
    
    def all_organizations(self):
        """Bypass organization filter (for superuser or reporting)"""
        return super().get_queryset()


class OrganizationEntity(models.Model):
    """
    Abstract base model for all organization-owned data
    Replaces TenantEntity from schema-based architecture
    """
    organization = models.ForeignKey(
        'Organization',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
        db_index=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Default manager with organization filtering
    objects = OrganizationManager()
    
    # Manager that bypasses organization filter (use carefully!)
    all_objects = models.Manager()
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        """Auto-assign current organization if not set"""
        if not self.organization_id:
            org = get_current_organization()
            if org:
                self.organization = org
            else:
                raise ValidationError(
                    f"{self.__class__.__name__} must have an organization. "
                    "Ensure middleware sets current_organization or set it explicitly."
                )
        super().save(*args, **kwargs)


class TimeStampedModel(models.Model):
    """Abstract base model with timestamps"""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


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
    
    def soft_delete(self, user=None):
        """Soft delete the object"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])
    
    def restore(self):
        """Restore soft-deleted object"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])


# =============================================================================
# 2. MIDDLEWARE (apps/core/middleware.py)
# =============================================================================

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
import logging

logger = logging.getLogger(__name__)


def get_current_user():
    """Get current user from context (async-safe)"""
    return current_user_var.get()


def set_current_user(user):
    """Set current user in context (async-safe)"""
    current_user_var.set(user)


def log_superuser_org_switch(user, organization):
    """Audit log when superuser switches organization context"""
    logger.warning(
        f"SUPERUSER_ORG_SWITCH: {user.email} (id={user.id}) "
        f"switched to organization {organization.name} (id={organization.id})",
        extra={
            'user_id': str(user.id),
            'organization_id': str(organization.id),
            'event': 'superuser_org_switch'
        }
    )


class OrganizationMiddleware(MiddlewareMixin):
    """
    Sets current organization based on authenticated user.
    MUST run AFTER AuthenticationMiddleware.
    """
    
    # Paths that don't require organization context
    PUBLIC_PATHS = [
        '/api/docs/',
        '/api/redoc/',
        '/api/schema/',
        '/api/health/',
        '/admin/',
        '/static/',
        '/media/',
    ]
    
    def process_request(self, request):
        # Clear previous context
        set_current_organization(None)
        set_current_user(None)
        
        # Check if path is public
        if any(request.path.startswith(path) for path in self.PUBLIC_PATHS):
            return None
        
        # Set user context
        if hasattr(request, 'user') and request.user.is_authenticated:
            set_current_user(request.user)
            
            # Set organization from user
            if hasattr(request.user, 'organization'):
                org = request.user.organization
                
                # Validate organization is active
                if not org.is_active:
                    return JsonResponse({
                        'error': 'Organization is not active',
                        'code': 'ORGANIZATION_INACTIVE'
                    }, status=403)
                
                # Validate subscription status
                if org.subscription_status in ['suspended', 'cancelled']:
                    return JsonResponse({
                        'error': 'Organization subscription is not active',
                        'code': 'SUBSCRIPTION_INACTIVE',
                        'subscription_status': org.subscription_status
                    }, status=403)
                
                set_current_organization(org)
                request.organization = org
                
                # Set PostgreSQL RLS context variable for database-level isolation
                if settings.ENABLE_POSTGRESQL_RLS:
                    try:
                        with connection.cursor() as cursor:
                            cursor.execute(
                                "SET LOCAL app.current_organization_id = %s",
                                [str(org.id)]
                            )
                    except Exception as e:
                        logger.error(f"Failed to set PostgreSQL RLS context: {e}")
            else:
                # User without organization
                if request.user.is_superuser:
                    # Superuser can work without organization context
                    # Optionally, allow X-Organization-ID header to switch context
                    org_id = request.headers.get('X-Organization-ID')
                    if org_id:
                        try:
                            from apps.core.models import Organization
                            org = Organization.objects.get(id=org_id, is_active=True)
                            
                            # AUDIT LOG: Track superuser context switching
                            log_superuser_org_switch(request.user, org)
                            
                            set_current_organization(org)
                            request.organization = org
                            
                            # Set PostgreSQL RLS for superuser too
                            if settings.ENABLE_POSTGRESQL_RLS:
                                try:
                                    with connection.cursor() as cursor:
                                        cursor.execute(
                                            "SET LOCAL app.current_organization_id = %s",
                                            [str(org.id)]
                                        )
                                except Exception as e:
                                    logger.error(f"Failed to set PostgreSQL RLS context: {e}")
                        except Organization.DoesNotExist:
                            logger.warning(
                                f"Superuser {request.user.email} attempted to switch to "
                                f"non-existent organization {org_id}"
                            )
                    return None
                else:
                    return JsonResponse({
                        'error': 'User does not belong to any organization',
                        'code': 'NO_ORGANIZATION'
                    }, status=403)
        
        return None
    
    def process_response(self, request, response):
        # Cleanup thread-local storage after request
        set_current_organization(None)
        set_current_user(None)
        return response


# =============================================================================
# 3. USER MODEL (apps/authentication/models.py)
# =============================================================================

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class UserManager(BaseUserManager):
    """Custom user manager"""
    
    def create_user(self, email, organization, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        if not organization:
            raise ValueError('Organization is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, organization=organization, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Superuser doesn't need organization (platform admin)
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        
        if not email:
            raise ValueError('Email is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with organization relationship
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Organization relationship (null for superuser)
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,  # Null for superuser
        blank=True,
        db_index=True
    )
    
    # Basic Info
    email = models.EmailField()  # NOT globally unique anymore
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    
    # Profile
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    
    # Flags
    is_active = models.BooleanField(default=True, db_index=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_org_admin = models.BooleanField(default=False)  # Admin within their organization
    
    # Security
    password_changed_at = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    # 2FA
    is_2fa_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'auth_user'
        # Email must be unique per organization
        unique_together = [('organization', 'email')]
        indexes = [
            models.Index(fields=['organization', 'email']),
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['email']),  # For superuser lookup
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


# =============================================================================
# 4. EXAMPLE MODELS (apps/employees/models.py)
# =============================================================================

from apps.core.models import OrganizationEntity


class Department(OrganizationEntity):
    """Department within an organization"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_departments'
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        unique_together = [('organization', 'code')]
        indexes = [
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['organization', 'code']),
        ]
    
    def __str__(self):
        return self.name


class Employee(OrganizationEntity):
    """Employee within an organization"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee'
    )
    
    employee_id = models.CharField(max_length=50, db_index=True)
    
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    
    designation = models.CharField(max_length=100, blank=True)
    
    employment_status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('probation', 'Probation'),
            ('inactive', 'Inactive'),
        ],
        default='active',
        db_index=True
    )
    
    date_of_joining = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True, db_index=True)
    
    class Meta:
        ordering = ['employee_id']
        # Employee ID unique per organization
        unique_together = [('organization', 'employee_id')]
        indexes = [
            models.Index(fields=['organization', 'employee_id']),
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['organization', 'employment_status']),
        ]
    
    def __str__(self):
        return f"{self.employee_id} - {self.user.full_name}"
    
    def save(self, *args, **kwargs):
        # Ensure user and employee have same organization
        if self.user.organization_id != self.organization_id:
            raise ValidationError("User and Employee must belong to the same organization")
        super().save(*args, **kwargs)


# =============================================================================
# 5. DRF PERMISSIONS (apps/core/permissions.py)
# =============================================================================

from rest_framework import permissions


class IsOrganizationMember(permissions.BasePermission):
    """
    User must belong to the same organization as the resource
    """
    message = "You do not have permission to access this resource"
    
    def has_permission(self, request, view):
        # Must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superuser has access to everything
        if request.user.is_superuser:
            return True
        
        # User must have an organization
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Superuser has access to everything
        if request.user.is_superuser:
            return True
        
        # Check if object has organization attribute
        if not hasattr(obj, 'organization'):
            return True  # Object doesn't belong to organization
        
        # User must belong to same organization as object
        return obj.organization_id == request.user.organization_id


class IsOrganizationAdmin(permissions.BasePermission):
    """
    User must be an admin within their organization
    """
    message = "You must be an organization admin to perform this action"
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superuser always has access
        if request.user.is_superuser:
            return True
        
        # Must be organization admin
        return request.user.is_org_admin


# =============================================================================
# 6. VIEWSET EXAMPLE (apps/employees/views.py)
# =============================================================================

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.permissions import IsOrganizationMember


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee model
    Automatically filtered by current organization via OrganizationManager
    """
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    filterset_fields = ['employment_status', 'department', 'is_active']
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['employee_id', 'date_of_joining', 'created_at']
    
    def get_queryset(self):
        """
        OrganizationManager automatically filters by current organization
        """
        return Employee.objects.select_related(
            'user',
            'department',
            'organization'
        ).filter(
            is_active=True
        )
    
    def perform_create(self, serializer):
        """
        Organization is auto-assigned by OrganizationEntity.save()
        """
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Custom action to deactivate employee"""
        employee = self.get_object()
        employee.is_active = False
        employee.save()
        return Response({'status': 'employee deactivated'})


# =============================================================================
# 7. SERIALIZER EXAMPLE (apps/employees/serializers.py)
# =============================================================================

from rest_framework import serializers


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id',
            'employee_id',
            'full_name',
            'email',
            'department',
            'department_name',
            'designation',
            'employment_status',
            'date_of_joining',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'organization']  # Don't expose organization
    
    def validate_department(self, department):
        """
        Ensure department belongs to user's organization
        """
        if department:
            user = self.context['request'].user
            if hasattr(user, 'organization'):
                if department.organization_id != user.organization_id:
                    raise serializers.ValidationError(
                        "Department does not belong to your organization"
                    )
        return department
    
    def validate(self, attrs):
        """
        Additional validation
        """
        request = self.context.get('request')
        
        # Ensure user belongs to same organization
        if 'user' in attrs:
            user_obj = attrs['user']
            if hasattr(request.user, 'organization'):
                if user_obj.organization_id != request.user.organization_id:
                    raise serializers.ValidationError({
                        'user': "User does not belong to your organization"
                    })
        
        return attrs


# =============================================================================
# 8. ADMIN INTERFACE (apps/employees/admin.py)
# =============================================================================

from django.contrib import admin


class OrganizationAdminMixin:
    """
    Mixin for admin to automatically filter by organization
    """
    
    def get_queryset(self, request):
        """Filter queryset by organization"""
        qs = super().get_queryset(request)
        
        # Superuser sees all
        if request.user.is_superuser:
            return qs.select_related('organization')
        
        # Regular staff sees only their organization
        if hasattr(request.user, 'organization'):
            return qs.filter(organization=request.user.organization)
        
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Filter foreign key choices by organization
        """
        # Get the model for this foreign key
        if hasattr(db_field.remote_field.model, 'organization'):
            if not request.user.is_superuser:
                if hasattr(request.user, 'organization'):
                    kwargs["queryset"] = db_field.remote_field.model.objects.filter(
                        organization=request.user.organization
                    )
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        """Auto-assign organization when creating"""
        if not change and hasattr(obj, 'organization'):  # New object
            if not obj.organization_id:
                if hasattr(request.user, 'organization'):
                    obj.organization = request.user.organization
        super().save_model(request, obj, form, change)


@admin.register(Employee)
class EmployeeAdmin(OrganizationAdminMixin, admin.ModelAdmin):
    list_display = [
        'employee_id',
        'get_full_name',
        'department',
        'employment_status',
        'organization',
        'is_active'
    ]
    list_filter = ['organization', 'employment_status', 'department', 'is_active']
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('employee_id', 'user', 'organization')
        }),
        ('Employment Details', {
            'fields': ('department', 'designation', 'employment_status', 'date_of_joining')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.full_name
    get_full_name.short_description = 'Name'
    get_full_name.admin_order_field = 'user__first_name'


# =============================================================================
# 9. CELERY TASK EXAMPLE (apps/payroll/tasks.py)
# =============================================================================

from celery import shared_task
from apps.core.middleware import set_current_organization
from apps.core.models import Organization


@shared_task
def process_payroll(payroll_run_id, organization_id):
    """
    Process payroll for a specific organization.
    CRITICAL: ALWAYS pass organization_id to async tasks.
    Uses contextvars which is async-safe (unlike threading.local).
    """
    # Set organization context (async-safe)
    org = Organization.objects.get(id=organization_id)
    set_current_organization(org)
    
    # Now all queries are automatically scoped to this organization
    from apps.payroll.models import PayrollRun
    
    payroll_run = PayrollRun.objects.get(id=payroll_run_id)
    
    # Process payroll...
    employees = payroll_run.organization.employees_employee_set.filter(is_active=True)
    
    for employee in employees:
        # Generate payslip...
        pass
    
    return f"Processed payroll for {employees.count()} employees"


@shared_task
def send_payslip_email(payslip_id, organization_id):
    """Send payslip email"""
    org = Organization.objects.get(id=organization_id)
    set_current_organization(org)
    
    from apps.payroll.models import Payslip
    payslip = Payslip.objects.get(id=payslip_id)
    
    # Send email...
    pass


# =============================================================================
# 10. JWT TOKEN CUSTOMIZATION (apps/authentication/serializers.py)
# =============================================================================

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token with organization information
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add organization information
        # CRITICAL: organization_id is the ONLY isolation key
        # Slug and name are metadata for display only
        if hasattr(user, 'organization') and user.organization:
            token['organization_id'] = str(user.organization.id)  # ISOLATION KEY
            token['organization_slug'] = user.organization.slug    # Display/branding only
            token['organization_name'] = user.organization.name    # Display only
        
        # Add user information
        token['email'] = user.email
        token['user_id'] = str(user.id)
        token['full_name'] = user.full_name
        token['is_org_admin'] = user.is_org_admin
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra response data
        user = self.user
        if hasattr(user, 'organization') and user.organization:
            data['organization'] = {
                'id': str(user.organization.id),
                'name': user.organization.name,
                'slug': user.organization.slug,
                'logo': user.organization.logo.url if user.organization.logo else None,
            }
        
        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'full_name': user.full_name,
            'is_org_admin': user.is_org_admin,
        }
        
        return data


# =============================================================================
# 11. TESTING EXAMPLE (apps/employees/tests/test_isolation.py)
# =============================================================================

from django.test import TestCase
from apps.core.models import Organization
from apps.core.middleware import set_current_organization
from apps.authentication.models import User
from apps.employees.models import Employee, Department


class OrganizationIsolationTest(TestCase):
    """Test that organization isolation works correctly"""
    
    def setUp(self):
        # Create two organizations
        self.org1 = Organization.objects.create(
            name="Organization 1",
            slug="org1",
            email="admin@org1.com"
        )
        self.org2 = Organization.objects.create(
            name="Organization 2",
            slug="org2",
            email="admin@org2.com"
        )
        
        # Create users for each organization
        self.user1 = User.objects.create_user(
            email="user@org1.com",
            organization=self.org1,
            password="password123",
            first_name="User",
            last_name="One"
        )
        self.user2 = User.objects.create_user(
            email="user@org2.com",
            organization=self.org2,
            password="password123",
            first_name="User",
            last_name="Two"
        )
        
        # Create departments
        set_current_organization(self.org1)
        self.dept1 = Department.objects.create(
            name="Engineering",
            code="ENG"
        )
        
        set_current_organization(self.org2)
        self.dept2 = Department.objects.create(
            name="Engineering",
            code="ENG"  # Same code, different organization
        )
        
        # Create employees
        set_current_organization(self.org1)
        self.emp1 = Employee.objects.create(
            user=self.user1,
            employee_id="EMP001",
            department=self.dept1
        )
        
        set_current_organization(self.org2)
        self.emp2 = Employee.objects.create(
            user=self.user2,
            employee_id="EMP001",  # Same ID, different organization
            department=self.dept2
        )
    
    def test_manager_filters_by_organization(self):
        """Test that OrganizationManager filters by current organization"""
        
        # Set to org1
        set_current_organization(self.org1)
        employees = list(Employee.objects.all())
        self.assertEqual(len(employees), 1)
        self.assertEqual(employees[0].employee_id, "EMP001")
        self.assertEqual(employees[0].organization, self.org1)
        
        # Set to org2
        set_current_organization(self.org2)
        employees = list(Employee.objects.all())
        self.assertEqual(len(employees), 1)
        self.assertEqual(employees[0].employee_id, "EMP001")
        self.assertEqual(employees[0].organization, self.org2)
        
        # Clear context
        set_current_organization(None)
        employees = list(Employee.objects.all())
        self.assertEqual(len(employees), 2)  # No filter
    
    def test_api_isolation(self):
        """Test that API endpoints respect organization isolation"""
        
        # Login as user1
        self.client.force_authenticate(user=self.user1)
        
        # Get employees
        response = self.client.get('/api/v1/employees/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['employee_id'], 'EMP001')
        
        # Try to access employee from org2 (should fail)
        response = self.client.get(f'/api/v1/employees/{self.emp2.id}/')
        self.assertEqual(response.status_code, 404)  # Not visible
        
        # Login as user2
        self.client.force_authenticate(user=self.user2)
        
        # Get employees
        response = self.client.get('/api/v1/employees/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        
        # Try to access employee from org1 (should fail)
        response = self.client.get(f'/api/v1/employees/{self.emp1.id}/')
        self.assertEqual(response.status_code, 404)  # Not visible
    
    def test_unique_constraints(self):
        """Test that unique constraints are per-organization"""
        
        # Both organizations can have employee with same employee_id
        set_current_organization(self.org1)
        emp1 = Employee.objects.get(employee_id='EMP001')
        self.assertEqual(emp1.organization, self.org1)
        
        set_current_organization(self.org2)
        emp2 = Employee.objects.get(employee_id='EMP001')
        self.assertEqual(emp2.organization, self.org2)
        
        # But can't have duplicate within same organization
        with self.assertRaises(Exception):
            Employee.objects.create(
                user=self.user2,
                employee_id='EMP001',  # Duplicate
                department=self.dept2
            )
