"""
QUICK REFERENCE: Production-Ready Organization-Based Multi-Tenancy
Corrected implementation with async safety and production hardening
"""

# =============================================================================
# 1. CONTEXT MANAGEMENT (Async-Safe)
# =============================================================================

# apps/core/context.py
from contextvars import ContextVar
import logging

logger = logging.getLogger(__name__)

# Context variables (async-safe, unlike threading.local)
current_organization_var = ContextVar('current_organization', default=None)
current_user_var = ContextVar('current_user', default=None)


def get_current_organization():
    """Get current organization from context (async-safe)"""
    return current_organization_var.get()


def set_current_organization(organization):
    """Set current organization in context (async-safe)"""
    current_organization_var.set(organization)


def get_current_user():
    """Get current user from context (async-safe)"""
    return current_user_var.get()


def set_current_user(user):
    """Set current user in context (async-safe)"""
    current_user_var.set(user)


# =============================================================================
# 2. SETTINGS CONFIGURATION
# =============================================================================

# config/settings/base.py
from decouple import config, Csv

# Environment
ENVIRONMENT = config('ENVIRONMENT', default='development')
DEBUG = config('DEBUG', default=True, cast=bool)

# Organization-based multi-tenancy settings
ENABLE_POSTGRESQL_RLS = config('ENABLE_POSTGRESQL_RLS', default=False, cast=bool)
REQUIRE_ORGANIZATION_CONTEXT = (ENVIRONMENT == 'production')

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'loggers': {
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}


# config/settings/production.py
ENVIRONMENT = 'production'
DEBUG = False
ENABLE_POSTGRESQL_RLS = True
REQUIRE_ORGANIZATION_CONTEXT = True


# =============================================================================
# 3. ORGANIZATION MODEL
# =============================================================================

# apps/core/models.py
import uuid
from django.db import models
from django.conf import settings

class Organization(models.Model):
    """
    Organization model - replaces Tenant.
    One organization = one company using the HRMS.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="UUID - the ONLY key used for data isolation"
    )
    
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="URL-friendly identifier for branding/display ONLY. NOT for tenant isolation."
    )
    
    email = models.EmailField()
    timezone = models.CharField(max_length=100, default='Asia/Kolkata')
    currency = models.CharField(max_length=3, default='INR')
    
    subscription_status = models.CharField(
        max_length=20,
        choices=[
            ('trial', 'Trial'),
            ('active', 'Active'),
            ('suspended', 'Suspended'),
        ],
        default='trial',
        db_index=True
    )
    
    is_active = models.BooleanField(default=True, db_index=True)
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


# =============================================================================
# 4. ORGANIZATION MANAGER (Production-Safe)
# =============================================================================

from django.db import models
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class OrganizationManager(models.Manager):
    """
    Manager that automatically filters by current organization.
    CRITICAL: Raises error in production if organization context is missing.
    """
    def get_queryset(self):
        from apps.core.context import get_current_organization
        
        qs = super().get_queryset()
        org = get_current_organization()
        
        if org is not None:
            return qs.filter(organization=org)
        
        # SAFETY CHECK: In production, missing org context is a bug
        if settings.REQUIRE_ORGANIZATION_CONTEXT:
            raise RuntimeError(
                f"CRITICAL: Organization context missing for {self.model.__name__} query. "
                "This could cause data leakage. Use .all_objects if intentional."
            )
        
        # In development or when explicitly allowed
        logger.warning(
            f"Query on {self.model.__name__} without organization context. "
            f"Stack trace logged for debugging."
        )
        return qs
    
    def all_organizations(self):
        """Bypass organization filter (for superuser or reporting)"""
        return super().get_queryset()


class OrganizationEntity(models.Model):
    """
    Abstract base model for all organization-owned data.
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
            from apps.core.context import get_current_organization
            org = get_current_organization()
            if org:
                self.organization = org
            else:
                raise ValueError(
                    f"{self.__class__.__name__} must have an organization. "
                    "Set organization explicitly or ensure middleware sets current_organization."
                )
        super().save(*args, **kwargs)


# =============================================================================
# 5. MIDDLEWARE (Async-Safe with RLS and Audit Logging)
# =============================================================================

# apps/core/middleware.py
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def log_superuser_org_switch(user, organization, request=None):
    """Audit log when superuser switches organization context"""
    logger.warning(
        f"SUPERUSER_ORG_SWITCH: {user.email} (id={user.id}) "
        f"switched to organization {organization.name} (id={organization.id})",
        extra={
            'event': 'superuser_org_switch',
            'user_id': str(user.id),
            'user_email': user.email,
            'organization_id': str(organization.id),
            'organization_name': organization.name,
            'ip_address': request.META.get('REMOTE_ADDR') if request else None,
        }
    )


class OrganizationMiddleware(MiddlewareMixin):
    """
    Sets current organization based on authenticated user.
    Includes PostgreSQL RLS support and superuser audit logging.
    """
    
    PUBLIC_PATHS = ['/api/docs/', '/api/health/', '/admin/', '/static/', '/media/']
    
    def process_request(self, request):
        from apps.core.context import set_current_organization, set_current_user
        from apps.core.models import Organization
        
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
            if hasattr(request.user, 'organization') and request.user.organization:
                org = request.user.organization
                
                # Validate organization is active
                if not org.is_active:
                    return JsonResponse({
                        'error': 'Organization is not active',
                        'code': 'ORGANIZATION_INACTIVE'
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
                    # Allow X-Organization-ID header to switch context
                    org_id = request.headers.get('X-Organization-ID')
                    if org_id:
                        try:
                            org = Organization.objects.get(id=org_id, is_active=True)
                            
                            # AUDIT LOG: Track superuser context switching
                            log_superuser_org_switch(request.user, org, request)
                            
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
        from apps.core.context import set_current_organization, set_current_user
        
        # Cleanup context after request
        set_current_organization(None)
        set_current_user(None)
        return response


# =============================================================================
# 6. JWT TOKEN (organization_id is ONLY isolation key)
# =============================================================================

# apps/authentication/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token with organization information"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add organization information
        # CRITICAL: organization_id is the ONLY isolation key
        # Slug and name are metadata for display only
        if hasattr(user, 'organization') and user.organization:
            token['organization_id'] = str(user.organization.id)  # 🔑 ISOLATION KEY
            token['organization_slug'] = user.organization.slug    # Display/branding only
            token['organization_name'] = user.organization.name    # Display only
        
        token['email'] = user.email
        token['user_id'] = str(user.id)
        
        return token


# =============================================================================
# 7. CELERY TASKS (Async-Safe with Organization Context)
# =============================================================================

# apps/payroll/tasks.py
from celery import shared_task
from apps.core.context import set_current_organization
from apps.core.models import Organization


@shared_task
def process_payroll(payroll_run_id, organization_id):
    """
    Process payroll for a specific organization.
    CRITICAL: ALWAYS pass organization_id to async tasks.
    Uses contextvars which is async-safe.
    """
    # Set organization context (async-safe)
    org = Organization.objects.get(id=organization_id)
    set_current_organization(org)
    
    # Now all queries are automatically scoped to this organization
    from apps.payroll.models import PayrollRun
    payroll_run = PayrollRun.objects.get(id=payroll_run_id)
    
    # Process payroll...
    pass


# =============================================================================
# 8. POSTGRESQL ROW-LEVEL SECURITY (Optional but Recommended)
# =============================================================================

"""
-- Enable RLS on all organization-owned tables
ALTER TABLE employees_employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_employeesalary ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_attendancerecord ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY org_isolation ON employees_employee
    USING (organization_id::text = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation ON payroll_employeesalary
    USING (organization_id::text = current_setting('app.current_organization_id', true));

CREATE POLICY org_isolation ON attendance_attendancerecord
    USING (organization_id::text = current_setting('app.current_organization_id', true));

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
"""


# =============================================================================
# 9. TESTING (Isolation Verification)
# =============================================================================

# apps/employees/tests/test_isolation.py
from django.test import TestCase
from apps.core.models import Organization
from apps.core.context import set_current_organization
from apps.authentication.models import User
from apps.employees.models import Employee


class OrganizationIsolationTest(TestCase):
    """Test that organization isolation works correctly"""
    
    def setUp(self):
        # Create two organizations
        self.org1 = Organization.objects.create(name="Org 1", slug="org1", email="admin@org1.com")
        self.org2 = Organization.objects.create(name="Org 2", slug="org2", email="admin@org2.com")
        
        # Create users
        self.user1 = User.objects.create_user(
            email="user@org1.com", organization=self.org1, password="pass"
        )
        self.user2 = User.objects.create_user(
            email="user@org2.com", organization=self.org2, password="pass"
        )
        
        # Create employees
        set_current_organization(self.org1)
        self.emp1 = Employee.objects.create(user=self.user1, employee_id="EMP001")
        
        set_current_organization(self.org2)
        self.emp2 = Employee.objects.create(user=self.user2, employee_id="EMP001")
    
    def test_manager_filters_by_organization(self):
        """OrganizationManager should auto-filter by current organization"""
        set_current_organization(self.org1)
        employees = list(Employee.objects.all())
        self.assertEqual(len(employees), 1)
        self.assertEqual(employees[0].organization, self.org1)
        
        set_current_organization(self.org2)
        employees = list(Employee.objects.all())
        self.assertEqual(len(employees), 1)
        self.assertEqual(employees[0].organization, self.org2)
    
    def test_production_safety_check(self):
        """In production mode, missing org context should raise error"""
        from django.conf import settings
        
        # Temporarily enable production mode
        old_require = settings.REQUIRE_ORGANIZATION_CONTEXT
        settings.REQUIRE_ORGANIZATION_CONTEXT = True
        
        try:
            set_current_organization(None)
            with self.assertRaises(RuntimeError) as cm:
                list(Employee.objects.all())
            
            self.assertIn("Organization context missing", str(cm.exception))
        finally:
            settings.REQUIRE_ORGANIZATION_CONTEXT = old_require


# =============================================================================
# 10. GOLDEN RULES (Copy to team wiki)
# =============================================================================

"""
🔒 GOLDEN RULES FOR ORGANIZATION-BASED MULTI-TENANCY

1. organization_id is the ONLY isolation key
   - Never use slug, name, or any other field for security
   - Always filter by: .filter(organization_id=org_id)

2. Use contextvars, not threading.local()
   - Required for async support (Django async views, Channels, etc.)
   - from contextvars import ContextVar

3. Never query without org context in production
   - OrganizationManager raises RuntimeError if context missing
   - Use .all_objects only when explicitly needed (superuser, reporting)

4. Always pass organization_id to async tasks
   - Celery: task(payroll_id, organization_id)
   - Channels: consumer receives organization_id
   - Background jobs: always include org context

5. Add DB constraints + indexes early
   - unique_together = [('organization', 'field')]
   - indexes = [models.Index(fields=['organization', 'field'])]

6. Enable PostgreSQL RLS in production
   - Defense in depth: DB enforces isolation even if app has bugs
   - ENABLE_POSTGRESQL_RLS = True

7. Audit log superuser activity
   - Log all X-Organization-ID header usage
   - Required for compliance

8. Test isolation explicitly
   - Unit tests for manager filtering
   - Integration tests for API isolation
   - Security tests for cross-org access attempts

9. Slug is metadata only
   - Use for: URLs, branding, display
   - Never for: security, isolation, data filtering

10. Monitor production logs
    - Alert on: "Organization context missing"
    - Alert on: Superuser org switches
    - Alert on: Failed RLS context sets
"""
