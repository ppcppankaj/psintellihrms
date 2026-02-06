# 🚀 DEFINITIVE MIGRATION PLAN
## Schema-Based Multi-Tenancy → Organization-Based Multi-Tenancy

**Date:** January 27, 2026  
**Target:** Django 5.x + DRF HRMS SaaS  
**Current Architecture:** django-tenants (PostgreSQL schemas)  
**Target Architecture:** Single database with Organization FK

---

## 🔴 CRITICAL DESIGN DECISIONS

### 1. Slug Usage Clarification
**Question:** Should we remove slug completely?

**Answer:** **Keep slug as METADATA ONLY**

- ✅ **Use slug for:** Display, URLs, branding, user-friendly identifiers
- ❌ **Never use slug for:** Tenant isolation, security, data filtering
- 🔑 **Isolation key:** `organization_id` (UUID) ONLY

```python
# ✅ CORRECT: Isolation by organization_id
token['organization_id'] = str(user.organization.id)  # Security
token['organization_slug'] = user.organization.slug    # Display/UX

# ❌ WRONG: Using slug for isolation
org = Organization.objects.get(slug=request.headers.get('X-Tenant-Slug'))
```

### 2. Async Safety (CRITICAL)
**Problem:** `threading.local()` breaks with async views, Channels, and modern Django

**Solution:** Use `contextvars` (Python 3.8+)

```python
# ❌ WRONG: Thread-locals (breaks async)
import threading
_thread_locals = threading.local()

# ✅ CORRECT: Context variables (async-safe)
from contextvars import ContextVar
current_organization_var = ContextVar('current_organization', default=None)
```

### 3. Production Safety Checks
**Problem:** Auto-filtering can hide bugs if organization context is missing

**Solution:** Raise explicit errors in production

```python
class OrganizationManager(models.Manager):
    def get_queryset(self):
        org = get_current_organization()
        if org is None:
            if settings.ENVIRONMENT == 'production':
                raise RuntimeError(
                    "Organization context missing - potential data leak!"
                )
        return super().get_queryset().filter(organization=org)
```

### 4. Database-Level Safety (Optional but Recommended)
**Use PostgreSQL Row-Level Security (RLS)**

```sql
-- Enable RLS on all organization-owned tables
ALTER TABLE employees_employee ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON employees_employee
    USING (organization_id::text = current_setting('app.current_organization_id', true));
```

Middleware sets context:
```python
with connection.cursor() as cursor:
    cursor.execute(
        "SET LOCAL app.current_organization_id = %s",
        [str(org.id)]
    )
```

### 5. Superuser Audit Logging
**Problem:** Superusers switching org context needs tracking

**Solution:** Explicit audit logging

```python
if request.user.is_superuser and org_id_header:
    log_superuser_org_switch(request.user, org)
    # Track: who, when, which org, from where
```

---

## ✅ DEFINITIVE ANSWER: **YES, IT IS POSSIBLE AND RECOMMENDED**

### Executive Summary

**Can you migrate?** → **YES, 100% feasible**

**Should you migrate?** → **YES, for the following reasons:**

1. **Simpler architecture** - No schema routing complexity
2. **Better performance** - Reduced connection overhead
3. **Easier backups** - Single database dump
4. **Cross-organization queries** - Analytics, reporting, super admin features
5. **Standard Django** - No need for django-tenants library
6. **Easier testing** - No schema switching in tests
7. **Better cloud support** - Works with managed databases that don't support schemas well
8. **Cost effective** - Single database connection pool

**Complexity:** Medium (2-3 weeks for full migration with testing)

---

## 📊 ARCHITECTURE COMPARISON

### Current (Schema-Based)
```
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
├─────────────────────────────────────────┤
│ Schema: public                          │
│   ├── Tenant (companies)                │
│   ├── Domain (subdomains)               │
│   ├── User (shared across all tenants?) │
│   └── Billing (subscription plans)      │
├─────────────────────────────────────────┤
│ Schema: acme_corp                       │
│   ├── Employee                          │
│   ├── Payroll                           │
│   ├── Attendance                        │
│   └── ... (all tenant data)             │
├─────────────────────────────────────────┤
│ Schema: globex_inc                      │
│   ├── Employee                          │
│   ├── Payroll                           │
│   └── ...                               │
└─────────────────────────────────────────┘

Request Flow:
1. HTTP request → middleware checks subdomain
2. Middleware switches to tenant schema
3. All queries run in that schema
4. User in "acme_corp" schema can't see "globex_inc"
```

### Target (Organization-Based)
```
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
│              (Single Schema)            │
├─────────────────────────────────────────┤
│ Organization (companies)                │
│   ├── id: 1 (name: "ACME Corp")        │
│   ├── id: 2 (name: "Globex Inc")       │
│   └── id: 3 (name: "Initech")          │
├─────────────────────────────────────────┤
│ User                                    │
│   ├── id, email, password               │
│   └── organization_id (FK)              │
├─────────────────────────────────────────┤
│ Employee                                │
│   ├── id, user_id (FK)                  │
│   └── organization_id (FK)              │
├─────────────────────────────────────────┤
│ Payroll                                 │
│   ├── id, employee_id (FK)              │
│   └── organization_id (FK)              │
├─────────────────────────────────────────┤
│ Attendance                              │
│   ├── id, employee_id (FK)              │
│   └── organization_id (FK)              │
└─────────────────────────────────────────┘

Request Flow:
1. HTTP request → JWT contains organization_id
2. Middleware sets current_organization in thread-local
3. Manager/QuerySet auto-filters by organization_id
4. User in org_id=1 can't see data from org_id=2
```

---

## 🎯 PROS & CONS COMPARISON

### Organization-Based (Target) ✅

**Pros:**
- ✅ Simpler codebase (no schema switching)
- ✅ Standard Django patterns
- ✅ Single database backup/restore
- ✅ Cross-organization analytics possible
- ✅ Better for horizontal scaling
- ✅ Easier to understand and debug
- ✅ No migration complexity per tenant
- ✅ Works with any database (MySQL, SQLite for dev)
- ✅ Better test isolation
- ✅ Easier CI/CD (single migration path)

**Cons:**
- ⚠️ Must manually add `organization_id` to every query (mitigated by managers)
- ⚠️ Risk of query forgetting `organization_id` filter (mitigated by code review + tests)
- ⚠️ All data in one schema (not a true con, but psychological)
- ⚠️ Need row-level security enforcement

### Schema-Based (Current) ⚠️

**Pros:**
- ✅ Strong database-level isolation
- ✅ No need to filter by organization_id
- ✅ Can have tenant-specific migrations

**Cons:**
- ❌ Complex middleware and schema switching
- ❌ Cross-tenant queries difficult
- ❌ Backup/restore per schema
- ❌ Connection pool per schema
- ❌ Migration must run per schema (slow)
- ❌ Testing complexity (schema fixtures)
- ❌ Not all databases support schemas
- ❌ Harder to debug (which schema am I in?)
- ❌ django-tenants dependency and upgrades

---

## 🔄 MIGRATION STRATEGY

### Phase 1: Preparation (Week 1)

#### 1.1 Create Organization Model
```python
# apps/core/models.py
from django.db import models
from django.core.validators import RegexValidator
import uuid

class Organization(models.Model):
    """
    Replaces Tenant model.
    One organization = one company using the HRMS.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Info
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="URL-friendly identifier for branding/display. NOT for tenant isolation."
    )
    logo = models.ImageField(upload_to='organizations/logos/', null=True, blank=True)
    
    # Contact
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    
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
        ],
        default='trial'
    )
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    
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
        ]
    
    def __str__(self):
        return self.name
```

#### 1.2 Create Organization-Aware Base Model
```python
# apps/core/models.py

class OrganizationManager(models.Manager):
    """
    Manager that automatically filters by current organization.
    """
    def get_queryset(self):
        from apps.core.middleware import get_current_organization
        
        qs = super().get_queryset()
        org = get_current_organization()
        
        if org is not None:
            return qs.filter(organization=org)
        
        # In management commands or tasks, return all
        return qs
    
    def all_organizations(self):
        """Get objects from all organizations (for super admin)"""
        return super().get_queryset()


class OrganizationEntity(models.Model):
    """
    Base model for all organization-owned data.
    Replaces TenantEntity.
    """
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
        db_index=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = OrganizationManager()
    all_objects = models.Manager()  # Bypass organization filter
    
    class Meta:
        abstract = True
        # Add composite index on organization + common filters
        indexes = []
    
    def save(self, *args, **kwargs):
        # Auto-assign current organization if not set
        if not self.organization_id:
            from apps.core.middleware import get_current_organization
            org = get_current_organization()
            if org:
                self.organization = org
            else:
                raise ValueError(
                    f"{self.__class__.__name__} must have an organization. "
                    "Set organization explicitly or ensure middleware sets current_organization."
                )
        super().save(*args, **kwargs)
```

#### 1.3 Update User Model
```python
# apps/authentication/models.py

class User(AbstractBaseUser, PermissionsMixin):
    """User belongs to ONE organization"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # NEW: Organization relationship
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name='users',
        db_index=True
    )
    
    email = models.EmailField()  # No longer unique=True globally
    # ... rest of fields ...
    
    class Meta:
        # Email unique per organization only
        unique_together = [('organization', 'email')]
        indexes = [
            models.Index(fields=['organization', 'email']),
            models.Index(fields=['organization', 'is_active']),
        ]
```

#### 1.4 Create Middleware
```python
# apps/core/middleware.py
from contextvars import ContextVar
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
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


class OrganizationMiddleware(MiddlewareMixin):
    """
    Sets current organization based on authenticated user.
    Must run AFTER AuthenticationMiddleware.
    """
    
    def process_request(self, request):
        # Clear previous context
        set_current_organization(None)
        set_current_user(None)
        
        # Public paths don't need organization context
        public_paths = ['/api/docs/', '/api/health/', '/admin/']
        if any(request.path.startswith(path) for path in public_paths):
            return None
        
        # Set user context
        if hasattr(request, 'user') and request.user.is_authenticated:
            set_current_user(request.user)
            
            # Set organization from user
            if hasattr(request.user, 'organization'):
                set_current_organization(request.user.organization)
                request.organization = request.user.organization
            else:
                # Superuser without organization (platform admin)
                if request.user.is_superuser:
                    # Allow access without organization
                    return None
                else:
                    return JsonResponse({
                        'error': 'User does not belong to any organization'
                    }, status=403)
        
        return None
    
    def process_response(self, request, response):
        # Cleanup thread-local after request
        set_current_organization(None)
        set_current_user(None)
        return response
```

---

### Phase 2: Model Migration (Week 2)

#### 2.1 Update ALL Models

**Pattern to follow for every model:**

**Before (Schema-Based):**
```python
# apps/employees/models.py
from apps.core.models import TenantEntity

class Employee(TenantEntity):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True)
    # ... fields ...
```

**After (Organization-Based):**
```python
# apps/employees/models.py
from apps.core.models import OrganizationEntity

class Employee(OrganizationEntity):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True)
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['organization', 'employee_id']),
            models.Index(fields=['organization', 'is_active']),
        ]
```

**Models to update:**
- ✅ Employee
- ✅ Department
- ✅ Designation
- ✅ Location
- ✅ EmployeeSalary
- ✅ PayrollRun
- ✅ Payslip
- ✅ AttendanceRecord
- ✅ Shift
- ✅ GeoFence
- ✅ LeaveRequest
- ✅ LeaveBalance
- ✅ Holiday
- ✅ All other tenant-specific models

#### 2.2 ViewSet Pattern

**Before:**
```python
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()  # Auto-filtered by schema
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
```

**After:**
```python
class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # OrganizationManager auto-filters by current organization
        return Employee.objects.select_related(
            'user', 'department', 'designation'
        )
    
    def perform_create(self, serializer):
        # Organization auto-assigned by OrganizationEntity.save()
        serializer.save()
```

---

### Phase 3: Data Migration (Week 2-3)

#### 3.1 Migration Script

```python
# apps/core/management/commands/migrate_schemas_to_organizations.py
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django_tenants.utils import get_tenant_model
from apps.core.models import Organization
from apps.authentication.models import User
from apps.employees.models import Employee
# Import all other models...

class Command(BaseCommand):
    help = 'Migrate from schema-based to organization-based multi-tenancy'
    
    def handle(self, *args, **options):
        TenantModel = get_tenant_model()
        
        # Get all tenants (excluding public schema)
        tenants = TenantModel.objects.exclude(schema_name='public')
        
        self.stdout.write(f"Found {tenants.count()} tenants to migrate")
        
        for tenant in tenants:
            self.stdout.write(f"\nMigrating tenant: {tenant.name} ({tenant.schema_name})")
            
            with transaction.atomic():
                # Step 1: Create Organization from Tenant
                org = Organization.objects.create(
                    name=tenant.name,
                    slug=tenant.slug,
                    logo=tenant.logo,
                    email=tenant.email,
                    phone=tenant.phone,
                    timezone=tenant.timezone,
                    currency=tenant.currency,
                    subscription_status=tenant.subscription_status,
                    is_active=tenant.is_active,
                    created_at=tenant.created_at,
                    updated_at=tenant.updated_at,
                )
                
                self.stdout.write(f"  ✓ Created Organization: {org.name}")
                
                # Step 2: Switch to tenant schema
                connection.set_schema(tenant.schema_name)
                
                # Step 3: Migrate Users
                tenant_users = User.objects.all()
                for user in tenant_users:
                    # Switch back to public to update user
                    connection.set_schema_to_public()
                    user.organization = org
                    user.save(update_fields=['organization'])
                
                self.stdout.write(f"  ✓ Migrated {tenant_users.count()} users")
                
                # Step 4: Migrate all tenant-owned data
                connection.set_schema(tenant.schema_name)
                
                # Employees
                employees = Employee.all_objects.all()
                for emp in employees:
                    connection.set_schema_to_public()
                    emp.organization = org
                    emp.save(update_fields=['organization'])
                
                self.stdout.write(f"  ✓ Migrated {employees.count()} employees")
                
                # Repeat for all models:
                # - PayrollRun, Payslip
                # - AttendanceRecord
                # - LeaveRequest
                # - etc.
        
        self.stdout.write(self.style.SUCCESS("\n✅ Migration complete!"))
```

#### 3.2 Migration Steps

```bash
# Step 1: Backup database
pg_dump hrms_prod > backup_before_migration.sql

# Step 2: Add organization_id column to all tables (allow null temporarily)
python manage.py makemigrations
python manage.py migrate

# Step 3: Run data migration
python manage.py migrate_schemas_to_organizations

# Step 4: Make organization_id NOT NULL
# Update migrations to set null=False after data is migrated

# Step 5: Remove django-tenants
pip uninstall django-tenants

# Step 6: Update settings.py (see below)

# Step 7: Drop old schemas (optional, keep for backup initially)
# psql -d hrms_prod -c "DROP SCHEMA acme_corp CASCADE;"
```

---

### Phase 4: Configuration Updates

#### 4.1 Settings Changes

**Remove from settings:**
```python
# DELETE THESE:
TENANT_MODEL = "tenants.Tenant"
TENANT_DOMAIN_MODEL = "tenants.Domain"
DATABASE_ROUTERS = ['django_tenants.routers.TenantSyncRouter']

SHARED_APPS = [...]
TENANT_APPS = [...]
```

**Replace with:**
```python
# config/settings/base.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # DRF
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    
    # Async
    'channels',
    'django_celery_results',
    'django_celery_beat',
    
    # Apps
    'apps.core',
    'apps.authentication',
    'apps.abac',
    'apps.employees',
    'apps.payroll',
    'apps.attendance',
    'apps.leave',
    'apps.recruitment',
    'apps.performance',
    # ... rest of your apps
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # NEW: Organization middleware (MUST be after AuthenticationMiddleware)
    'apps.core.middleware.OrganizationMiddleware',
]

# Remove tenant-related settings

# Add organization-related settings
ENABLE_POSTGRESQL_RLS = config('ENABLE_POSTGRESQL_RLS', default=True, cast=bool)
ENVIRONMENT = config('ENVIRONMENT', default='development')  # production, staging, development

# Safety: Enforce organization context in production
if ENVIRONMENT == 'production':
    REQUIRE_ORGANIZATION_CONTEXT = True
else:
    REQUIRE_ORGANIZATION_CONTEXT = False
```

#### 4.2 Update JWT Token Claims

```python
# apps/authentication/views.py or serializers

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add organization to JWT token
        if hasattr(user, 'organization'):
            token['organization_id'] = str(user.organization.id)
            token['organization_slug'] = user.organization.slug
        
        # Add other claims
        token['email'] = user.email
        token['user_id'] = str(user.id)
        
        return token
```

#### 4.3 Update Celery Tasks

**Before:**
```python
@app.task
def send_payslip_email(payslip_id):
    # Which schema? ❌
    payslip = Payslip.objects.get(id=payslip_id)
```

**After:**
```python
@app.task
def send_payslip_email(payslip_id, organization_id):
    from apps.core.middleware import set_current_organization
    from apps.core.models import Organization
    
    org = Organization.objects.get(id=organization_id)
    set_current_organization(org)
    
    payslip = Payslip.objects.get(id=payslip_id)  # Auto-filtered
    # Send email...
```

---

## 📁 RECOMMENDED FOLDER STRUCTURE

```
backend/
├── apps/
│   ├── core/
│   │   ├── models.py
│   │   │   ├── Organization (main model)
│   │   │   ├── OrganizationEntity (base class)
│   │   │   ├── OrganizationManager
│   │   │   └── TimeStampedModel, SoftDeleteModel
│   │   ├── middleware.py
│   │   │   ├── OrganizationMiddleware
│   │   │   ├── get_current_organization()
│   │   │   └── set_current_organization()
│   │   ├── permissions.py
│   │   │   └── IsOrganizationMember (DRF permission)
│   │   ├── admin.py
│   │   │   └── OrganizationAdmin (superuser only)
│   │   └── management/commands/
│   │       └── migrate_schemas_to_organizations.py
│   │
│   ├── authentication/
│   │   ├── models.py
│   │   │   └── User (with organization FK)
│   │   ├── views.py
│   │   │   ├── RegisterView (auto-assigns organization)
│   │   │   └── LoginView (sets current_organization)
│   │   └── serializers.py
│   │       └── CustomTokenObtainPairSerializer
│   │
│   ├── employees/
│   │   ├── models.py (inherits OrganizationEntity)
│   │   ├── views.py (queryset auto-filtered)
│   │   └── serializers.py
│   │
│   ├── payroll/
│   │   ├── models.py (inherits OrganizationEntity)
│   │   └── ...
│   │
│   ├── attendance/
│   │   ├── models.py (inherits OrganizationEntity)
│   │   └── ...
│   │
│   └── ... (all other apps)
│
├── config/
│   ├── settings/
│   │   ├── base.py (no TENANT_MODEL, no DATABASE_ROUTERS)
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── celery.py (updated for organization context)
│
└── requirements/
    └── base.txt (remove django-tenants)
```

---

## 🔒 ENFORCING DATA ISOLATION

### 1. Manager-Level Filtering (Automatic)

```python
# OrganizationManager in apps/core/models.py
class OrganizationManager(models.Manager):
    def get_queryset(self):
        from apps.core.middleware import get_current_organization
        org = get_current_organization()
        
        if org:
            return super().get_queryset().filter(organization=org)
        return super().get_queryset()
```

**Result:** All queries automatically filtered:
```python
Employee.objects.all()  # Only returns employees for current organization
Employee.objects.filter(is_active=True)  # Still filtered by organization
```

### 2. ViewSet-Level (DRF)

```python
# apps/core/permissions.py
from rest_framework import permissions

class IsOrganizationMember(permissions.BasePermission):
    """User must belong to the same organization as the resource"""
    
    def has_object_permission(self, request, view, obj):
        if not hasattr(obj, 'organization'):
            return True
        
        if not hasattr(request.user, 'organization'):
            return False
        
        return obj.organization_id == request.user.organization_id
```

```python
# apps/employees/views.py
class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOrganizationMember]
```

### 3. Serializer-Level Validation

```python
# apps/employees/serializers.py
class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'first_name', ...]
        # Don't expose organization field to API
        read_only_fields = ['organization']
    
    def validate_department(self, department):
        """Ensure department belongs to user's organization"""
        user_org = self.context['request'].user.organization
        if department.organization != user_org:
            raise ValidationError("Department does not belong to your organization")
        return department
```

### 4. Admin Interface

```python
# apps/core/admin.py
from django.contrib import admin
from django.db.models import Q

class OrganizationAdminMixin:
    """Mixin for admin to filter by organization"""
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs  # Superuser sees all
        if hasattr(request.user, 'organization'):
            return qs.filter(organization=request.user.organization)
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter FK choices by organization"""
        if hasattr(db_field.remote_field.model, 'organization'):
            if not request.user.is_superuser:
                kwargs["queryset"] = db_field.remote_field.model.objects.filter(
                    organization=request.user.organization
                )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Employee)
class EmployeeAdmin(OrganizationAdminMixin, admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'department', 'organization']
    list_filter = ['organization', 'department']
```

---

## 👥 USER ROLES & ACCESS CONTROL

### Architecture

```python
# apps/authentication/models.py

class User(AbstractBaseUser):
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE)
    
    # Role flags
    is_superuser = models.BooleanField(default=False)  # Platform admin (SaaS owner)
    is_org_admin = models.BooleanField(default=False)  # Organization admin
    is_staff = models.BooleanField(default=False)       # Can access Django admin
```

### 1. Superuser (SaaS Platform Admin)
- No organization assigned (or special "platform" organization)
- Can see all organizations
- Can switch between organizations
- Access via Django admin

```python
# apps/core/middleware.py
def process_request(self, request):
    if request.user.is_superuser:
        # Check for X-Organization-ID header to switch context
        org_id = request.headers.get('X-Organization-ID')
        if org_id:
            org = Organization.objects.filter(id=org_id, is_active=True).first()
            if org:
                set_current_organization(org)
        # Otherwise, no organization context (can query all)
        return None
```

### 2. Organization Admin
- Has `is_org_admin=True`
- Belongs to one organization
- Can manage users, settings, billing for their org

```python
# apps/authentication/permissions.py
class IsOrganizationAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            (request.user.is_org_admin or request.user.is_superuser)
        )
```

### 3. Normal Users
- Belongs to one organization
- Limited access based on ABAC/RBAC policies

**Integration with ABAC:**
```python
# apps/abac/engine.py already exists, just ensure:
class ABACEngine:
    def check_permission(self, user, action, resource):
        # Already checks user's roles and attributes
        # Now also ensures resource.organization == user.organization
        if hasattr(resource, 'organization'):
            if resource.organization != user.organization:
                return False
        # Continue with ABAC evaluation...
```

---

## ✅ VALIDATION & TESTING

### 1. Unit Tests

```python
# apps/employees/tests/test_isolation.py
from django.test import TestCase
from apps.core.models import Organization
from apps.authentication.models import User
from apps.employees.models import Employee
from apps.core.middleware import set_current_organization

class OrganizationIsolationTestCase(TestCase):
    def setUp(self):
        self.org1 = Organization.objects.create(name="Org 1", slug="org1")
        self.org2 = Organization.objects.create(name="Org 2", slug="org2")
        
        self.user1 = User.objects.create_user(
            email="user1@org1.com",
            organization=self.org1,
            password="pass"
        )
        self.user2 = User.objects.create_user(
            email="user2@org2.com",
            organization=self.org2,
            password="pass"
        )
        
        self.emp1 = Employee.all_objects.create(
            organization=self.org1,
            user=self.user1,
            employee_id="EMP001"
        )
        self.emp2 = Employee.all_objects.create(
            organization=self.org2,
            user=self.user2,
            employee_id="EMP002"
        )
    
    def test_manager_filters_by_organization(self):
        """OrganizationManager should auto-filter by current organization"""
        set_current_organization(self.org1)
        employees = list(Employee.objects.all())
        self.assertEqual(len(employees), 1)
        self.assertEqual(employees[0].employee_id, "EMP001")
        
        set_current_organization(self.org2)
        employees = list(Employee.objects.all())
        self.assertEqual(len(employees), 1)
        self.assertEqual(employees[0].employee_id, "EMP002")
    
    def test_cross_organization_access_prevented(self):
        """User from org1 cannot access org2 data via API"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/v1/employees/{self.emp2.id}/')
        self.assertEqual(response.status_code, 404)  # Not visible
```

### 2. Integration Tests

```python
def test_full_request_cycle(self):
    """Test complete request with JWT and organization context"""
    # Login
    response = self.client.post('/api/v1/auth/login/', {
        'email': 'user1@org1.com',
        'password': 'pass'
    })
    token = response.data['access']
    
    # Make authenticated request
    self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    response = self.client.get('/api/v1/employees/')
    
    # Should only see org1 employees
    self.assertEqual(len(response.data['results']), 1)
```

---

## 📦 WHAT TO DELETE

### Files to Remove:
```
backend/apps/tenants/                    # Entire app
backend/apps/core/middleware.py          # Replace with new OrganizationMiddleware
backend/apps/core/models.py              # Update TenantEntity → OrganizationEntity
```

### Settings to Remove:
```python
# Delete from config/settings/base.py
TENANT_MODEL
TENANT_DOMAIN_MODEL
DATABASE_ROUTERS
SHARED_APPS / TENANT_APPS (merge into INSTALLED_APPS)
```

### Dependencies to Remove:
```bash
# requirements/base.txt
# REMOVE:
django-tenants>=3.6
```

### Code Patterns to Replace:

**Find and replace:**
```python
# OLD                                    # NEW
from django_tenants.utils import        # DELETE (not needed)
connection.set_schema()                  # DELETE (not needed)
TenantEntity                            → OrganizationEntity
get_tenant_model()                      → Organization
schema_name                             → organization_id
tenant                                  → organization
```

---

## 🎬 STEP-BY-STEP EXECUTION PLAN

### Week 1: Preparation & New Code
- [ ] Day 1-2: Create Organization model and migrations
- [ ] Day 3: Create OrganizationEntity base class and OrganizationManager
- [ ] Day 4: Create OrganizationMiddleware and context helpers
- [ ] Day 5: Update User model with organization FK

### Week 2: Model Updates & Data Migration
- [ ] Day 1-2: Update all models to inherit from OrganizationEntity
- [ ] Day 3: Create and test data migration script
- [ ] Day 4: Run data migration on staging database
- [ ] Day 5: Validate data integrity and fix issues

### Week 3: Code Updates & Testing
- [ ] Day 1-2: Update all ViewSets and remove schema logic
- [ ] Day 3: Update Celery tasks with organization context
- [ ] Day 4: Update admin interface
- [ ] Day 5: Comprehensive testing

### Week 4: Production Deployment
- [ ] Day 1: Final staging validation
- [ ] Day 2: Production database backup
- [ ] Day 3: Run migration on production
- [ ] Day 4: Monitor and fix any issues
- [ ] Day 5: Remove django-tenants, cleanup code

---

## 🚀 PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Migration
- [ ] Full database backup
- [ ] Test migration on staging with production data snapshot
- [ ] Prepare rollback plan
- [ ] Schedule downtime window (2-4 hours recommended)

### During Migration
- [ ] Put application in maintenance mode
- [ ] Run data migration script
- [ ] Validate data integrity
- [ ] Deploy new code without django-tenants
- [ ] Test critical workflows

### Post-Migration
- [ ] Monitor application logs
- [ ] Test all API endpoints
- [ ] Verify frontend works correctly
- [ ] Monitor database performance
- [ ] Keep old schemas as backup for 1 week

### Rollback Plan
If migration fails:
1. Restore database from backup
2. Deploy old code with django-tenants
3. Investigate issues
4. Fix and retry

---

## 💡 BEST PRACTICES & TIPS

### 1. Always Use the Manager
```python
# ✅ GOOD - Uses OrganizationManager
Employee.objects.filter(is_active=True)

# ❌ BAD - Bypasses filtering
Employee.all_objects.filter(is_active=True)  # Only for superuser or migrations
```

### 2. Explicit Organization in Tests
```python
def test_create_employee(self):
    org = Organization.objects.create(name="Test Org", slug="test")
    set_current_organization(org)
    
    employee = Employee.objects.create(
        # organization auto-assigned from context
        employee_id="EMP001",
        ...
    )
```

### 3. Celery Tasks
```python
# Always pass organization_id to tasks
@app.task
def process_payroll(payroll_run_id, organization_id):
    org = Organization.objects.get(id=organization_id)
    set_current_organization(org)
    # Now all queries are scoped to this organization
```

### 4. Raw SQL Queries
```python
# If you must use raw SQL, always filter by organization
Employee.objects.raw(
    "SELECT * FROM employees_employee WHERE organization_id = %s",
    [current_org.id]
)
```

### 5. Add Database Constraints
```sql
-- PostgreSQL: Add row-level security (optional, advanced)
ALTER TABLE employees_employee ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_isolation ON employees_employee
    USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

---

## 📊 PERFORMANCE CONSIDERATIONS

### Indexing Strategy
```python
class Employee(OrganizationEntity):
    class Meta:
        indexes = [
            # Organization + frequently filtered fields
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['organization', 'employee_id']),
            models.Index(fields=['organization', 'department']),
        ]
```

### Query Optimization
```python
# Always use select_related for foreign keys in same organization
Employee.objects.select_related(
    'user',
    'department',
    'designation',
    'organization'  # Include organization to avoid extra query
)
```

### Database Statistics
```sql
-- Monitor query performance
SELECT
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_tup_ins - n_tup_del as net_inserts
FROM pg_stat_user_tables
WHERE tablename LIKE '%employee%';
```

---

## 🎓 REAL-WORLD EXAMPLES

### Companies Using Organization-Based Multi-Tenancy:
- **Slack** - Organization per workspace
- **GitHub** - Organization per account
- **Trello** - Organization per board/team
- **Notion** - Organization per workspace
- **Linear** - Organization per company

### Why They Chose This Approach:
1. Cross-organization features (e.g., shared boards, integrations)
2. Simpler codebase and faster development
3. Better analytics across all customers
4. Standard database practices

---

## ✅ FINAL RECOMMENDATION

**Migration Decision: ✅ PROCEED WITH ORGANIZATION-BASED ARCHITECTURE**

**Rationale:**
1. Your system is still in development/early production
2. Schema-based complexity outweighs benefits for your use case
3. Organization-based is industry standard for SaaS
4. Easier to maintain and scale
5. Better developer experience

**Timeline:** 3-4 weeks total
**Risk Level:** Medium (with proper testing)
**Return on Investment:** High (long-term maintainability)

---

## 📞 SUPPORT & QUESTIONS

If you encounter issues during migration:

1. **Data Integrity:** Run validation queries to ensure all records have organization_id
2. **Performance:** Add indexes on `organization_id` + frequently queried fields
3. **Isolation:** Write tests to verify users can't access other organizations
4. **ABAC Integration:** Ensure ABAC engine checks organization before policy evaluation

---

## 📝 CONCLUSION

**You asked: Is it possible?**
→ **YES, 100% possible and recommended**

**You asked: Should I do it?**
→ **YES, for long-term success**

**You asked: How to do it?**
→ **Follow this plan systematically**

This migration will significantly simplify your architecture, improve maintainability, and align with industry best practices for Django SaaS applications.

**Next Steps:**
1. Review this plan with your team
2. Set up a test environment
3. Start with Phase 1 (Preparation)
4. Test thoroughly on staging
5. Execute on production with proper backup

Good luck! 🚀
