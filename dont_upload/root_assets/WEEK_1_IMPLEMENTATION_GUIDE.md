# 🚀 WEEK 1 IMPLEMENTATION GUIDE
## Getting Started with Organization-Based Multi-Tenancy Migration

---

## ✅ FILES CREATED

I've created the core foundation files for your migration:

### 1. **apps/core/context.py** (NEW)
- Async-safe context management using `contextvars`
- Replaces thread-local storage
- Functions: `get_current_organization()`, `set_current_organization()`, etc.

### 2. **apps/core/models_organization.py** (NEW)
- `Organization` model (replaces Tenant)
- `OrganizationEntity` base class (replaces TenantEntity)
- `OrganizationManager` with production safety checks
- `AuditLog` model for compliance

### 3. **apps/core/middleware_organization.py** (NEW)
- `OrganizationMiddleware` (replaces UnifiedTenantMiddleware)
- Async-safe using contextvars
- PostgreSQL RLS support
- Superuser audit logging

### 4. **config/settings/organization_settings.py** (NEW)
- Settings configuration reference
- Shows what to add/remove

---

## 📋 WEEK 1 TASKS CHECKLIST

### Day 1-2: Database Setup

#### Task 1.1: Create Migration for Organization Model

```bash
# Create the migration
python manage.py makemigrations --empty core --name add_organization_model
```

Then edit the migration file:

```python
# backend/apps/core/migrations/00XX_add_organization_model.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('core', 'previous_migration'),
    ]
    
    operations = [
        # Copy the model definitions from models_organization.py
        # into this migration
        migrations.CreateModel(
            name='Organization',
            fields=[
                # ... copy from models_organization.py
            ],
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                # ... copy from models_organization.py
            ],
        ),
    ]
```

#### Task 1.2: Add organization_id to User Model

```bash
python manage.py makemigrations --empty authentication --name add_organization_to_user
```

Edit migration:

```python
# backend/apps/authentication/migrations/00XX_add_organization_to_user.py
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('core', '00XX_add_organization_model'),
        ('authentication', 'previous_migration'),
    ]
    
    operations = [
        migrations.AddField(
            model_name='user',
            name='organization',
            field=models.ForeignKey(
                null=True,  # Temporarily nullable
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='users',
                to='core.organization',
                db_index=True,
            ),
        ),
    ]
```

#### Task 1.3: Run Migrations

```bash
python manage.py migrate
```

---

### Day 3: Update Settings

#### Task 3.1: Update config/settings/base.py

```python
# Add at the top
from decouple import config

# Add new settings
ENVIRONMENT = config('ENVIRONMENT', default='development')
ENABLE_POSTGRESQL_RLS = config('ENABLE_POSTGRESQL_RLS', default=False, cast=bool)
REQUIRE_ORGANIZATION_CONTEXT = False  # Will enable in production

# Update MIDDLEWARE - ADD after AuthenticationMiddleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # NEW: Organization middleware
    'apps.core.middleware_organization.OrganizationMiddleware',
    
    # Keep old tenant middleware for now (will remove later)
    # 'apps.core.middleware.UnifiedTenantMiddleware',
]

# COMMENT OUT (don't delete yet - we'll remove after migration)
# TENANT_MODEL = "tenants.Tenant"
# TENANT_DOMAIN_MODEL = "tenants.Domain"
# DATABASE_ROUTERS = ['django_tenants.routers.TenantSyncRouter']
```

#### Task 3.2: Create .env entries

```bash
# Add to .env file
ENVIRONMENT=development
ENABLE_POSTGRESQL_RLS=False
REQUIRE_ORGANIZATION_CONTEXT=False
```

---

### Day 4: Update User Model

#### Task 4.1: Edit apps/authentication/models.py

Add the organization relationship:

```python
class User(AbstractBaseUser, PermissionsMixin):
    """User with organization relationship"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # NEW: Organization relationship
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,  # Temporarily nullable during migration
        blank=True,
        db_index=True
    )
    
    # Change email from unique=True to:
    email = models.EmailField()  # No longer globally unique
    
    # ... rest of fields ...
    
    class Meta:
        # NEW: Email unique per organization only
        unique_together = [('organization', 'email')]
        indexes = [
            models.Index(fields=['organization', 'email']),
            models.Index(fields=['organization', 'is_active']),
        ]
```

#### Task 4.2: Create migration

```bash
python manage.py makemigrations authentication
python manage.py migrate
```

---

### Day 5: Test Basic Setup

#### Task 5.1: Create Test Organization

```python
# In Django shell
python manage.py shell

from apps.core.models_organization import Organization
from apps.authentication.models import User
from apps.core.context import set_current_organization

# Create test organization
org = Organization.objects.create(
    name="Test Company",
    slug="test-company",
    email="admin@test.com"
)

# Create test user
user = User.objects.create_user(
    email="user@test.com",
    organization=org,
    password="testpass123",
    first_name="Test",
    last_name="User"
)

print(f"✅ Created organization: {org.name}")
print(f"✅ Created user: {user.email}")
```

#### Task 5.2: Test Context Management

```python
# Test context
from apps.core.context import set_current_organization, get_current_organization

set_current_organization(org)
current = get_current_organization()
print(f"✅ Current organization: {current.name}")

# Test clearing
from apps.core.context import clear_context
clear_context()
current = get_current_organization()
print(f"✅ Context cleared: {current}")  # Should be None
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests to Write

Create `backend/apps/core/tests/test_organization.py`:

```python
from django.test import TestCase
from apps.core.models_organization import Organization
from apps.core.context import set_current_organization, get_current_organization, clear_context

class OrganizationContextTest(TestCase):
    def setUp(self):
        self.org1 = Organization.objects.create(
            name="Org 1",
            slug="org1",
            email="admin@org1.com"
        )
        self.org2 = Organization.objects.create(
            name="Org 2",
            slug="org2",
            email="admin@org2.com"
        )
    
    def test_context_setting(self):
        """Test setting and getting organization context"""
        set_current_organization(self.org1)
        current = get_current_organization()
        self.assertEqual(current.id, self.org1.id)
    
    def test_context_clearing(self):
        """Test clearing organization context"""
        set_current_organization(self.org1)
        clear_context()
        current = get_current_organization()
        self.assertIsNone(current)
    
    def test_organization_model(self):
        """Test Organization model methods"""
        self.assertTrue(self.org1.is_subscription_active())
        self.assertFalse(self.org1.has_feature('advanced_analytics'))
        
        self.org1.features = {'advanced_analytics': True}
        self.org1.save()
        self.assertTrue(self.org1.has_feature('advanced_analytics'))
```

Run tests:

```bash
python manage.py test apps.core.tests.test_organization
```

---

## ⚠️ IMPORTANT NOTES

### 1. Don't Delete Tenant Code Yet
- Keep `apps/tenants/` for now
- Keep old middleware
- We'll remove after data migration in Week 2

### 2. Two Middleware Running
During transition, both middlewares will run:
- `OrganizationMiddleware` (new)
- `UnifiedTenantMiddleware` (old)

This is intentional - we'll remove the old one after migration.

### 3. Database State
After Week 1, you'll have:
- ✅ Organization model created
- ✅ User.organization FK added (nullable)
- ✅ Old Tenant model still exists
- ✅ Old schema-based data still intact

### 4. Environment Variables
Add to your `.env`:
```bash
ENVIRONMENT=development
ENABLE_POSTGRESQL_RLS=False
REQUIRE_ORGANIZATION_CONTEXT=False
```

---

## 🚨 TROUBLESHOOTING

### Issue: Migration conflicts
```bash
# If you get migration conflicts
python manage.py migrate --fake-initial
```

### Issue: Import errors
```bash
# Make sure __init__.py exists
touch backend/apps/core/__init__.py
```

### Issue: Context not persisting
- Ensure you're using `contextvars`, not `threading.local`
- Check middleware order (OrganizationMiddleware must be after AuthenticationMiddleware)

---

## 📊 WEEK 1 SUCCESS CRITERIA

✅ Organization model created in database  
✅ User model has organization FK  
✅ Context management working (contextvars)  
✅ Middleware installed and configured  
✅ Test organization created successfully  
✅ Tests passing  
✅ No errors in Django logs  

---

## 🎯 NEXT STEPS (Week 2)

After completing Week 1:

1. **Update all models** to add organization_id FK
2. **Create data migration script** to copy data from schemas
3. **Run migration on staging** with test data
4. **Validate data integrity**

---

## 💡 TIPS

1. **Commit frequently** - commit after each task
2. **Test thoroughly** - don't proceed if tests fail
3. **Check logs** - watch for warnings about missing context
4. **Ask questions** - review CRITICAL_CORRECTIONS_PRODUCTION_SAFETY.md if stuck

---

## 📞 NEED HELP?

- Review: CRITICAL_CORRECTIONS_PRODUCTION_SAFETY.md
- Check: IMPLEMENTATION_REFERENCE.py for code examples
- Reference: ARCHITECTURE_DIAGRAMS.md for visual explanations

**You're now ready to begin Week 1 implementation! 🚀**

Start with Day 1, Task 1.1 and work through systematically.
