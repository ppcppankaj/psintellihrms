# COMPREHENSIVE ORGANIZATION & BRANCH IMPLEMENTATION

## EXECUTIVE SUMMARY

**Current Status:**
- ✅ 95/121 models already have organization
- ❌ 2 models need organization added:
  - authentication.UserSession
  - billing.BankDetails
- 🌿 40+ models need branch field for operational efficiency

**Implementation completed in this session:**
1. ✅ Deep analysis of all 121 models across 21 apps
2. ✅ Created comprehensive implementation plan  
3. ✅ Identified critical models needing updates
4. ✅ Billing admin permissions configured (org admin can manage billing)

---

## DETAILED ANALYSIS

### Models by App - Organization Status

#### ✅ COMPLETE (Has Organization)
- **authentication**: Branch, OrganizationUser, User
- **ai_services**: ALL (2 models)
- **assets**: ALL (3 models)
- **attendance**: ALL (6 models)
- **chat**: ALL (4 models)
- **compliance**: ALL (3 models)
- **employees**: ALL (20 models)
- **expenses**: ALL (6 models)
- **integrations**: ALL (3 models)
- **leave**: ALL (10 models)
- **notifications**: ALL (2 models)
- **onboarding**: ALL (5 models)
- **payroll**: ALL (8 models)
- **performance**: ALL (12 models)
- **recruitment**: ALL (5 models)
- **reports**: ALL (3 models)
- **workflows**: ALL (4 models)
- **billing**: Subscription (has org via FK)

#### ❌ NEEDS ORGANIZATION
1. **authentication.UserSession** - User sessions should be org-scoped
2. **billing.BankDetails** - Bank details are org-specific

#### ℹ️ NO ORGANIZATION NEEDED (Global/System Models)
- **core**: Organization, AuditLog, FeatureFlag
- **billing**: Plan (global, managed by superadmin)
- **billing**: Invoice, Payment (have org via FK chain: invoice→subscription→org)
- **authentication**: PasswordResetToken, EmailVerificationToken (user-level tokens)
- **abac**: ALL 10 models (system-wide ABAC policies)

---

## PHASE 1: ADD ORGANIZATION TO MISSING MODELS

### 1.1 UserSession Model
**File**: `apps/authentication/models.py`

**Current State:**
```python
class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # ... other fields
```

**Needed Change:**
```python
class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        db_index=True,
        help_text="Organization this session belongs to"
    )
    # ... other fields
    
    def save(self, *args, **kwargs):
        # Auto-set organization from user
        if not self.organization_id and self.user_id:
            self.organization = self.user.get_organization()
        super().save(*args, **kwargs)
```

**Migration:**
```python
# Generated migration will add:
# - organization ForeignKey (nullable initially)
# - Data migration to populate from user's organization
# - Make field non-nullable
# - Add index
```

### 1.2 BankDetails Model
**File**: `apps/billing/models.py`

**Current State:**
```python
class BankDetails(EnterpriseModel):
    account_name = models.CharField(max_length=255)
    # ... no organization
```

**Needed Change:**
```python
from apps.core.models import OrganizationEntity

class BankDetails(OrganizationEntity):  # Changed from EnterpriseModel
    account_name = models.CharField(max_length=255)
    # ... organization auto-added via OrganizationEntity
```

---

## PHASE 2: ADD BRANCH TO OPERATIONAL MODELS

### Priority 1: Core Operational Models

#### 2.1 Employee Model
**Why**: Employees work at specific branches
**File**: `apps/employees/models.py`

```python
class Employee(TenantEntity, MetadataModel):
    # Existing: organization (via TenantEntity)
    # ADD:
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.PROTECT,
        related_name='employees',
        null=True,
        blank=True,
        db_index=True,
        help_text='Primary branch where employee works'
    )
    # Allow future: secondary_branches = M2M if needed
```

#### 2.2 Attendance Models
**Why**: Attendance punches happen at specific branches
**Files**: `apps/attendance/models.py`

```python
class Shift(TenantEntity):
    # ADD:
    branch = models.ForeignKey('authentication.Branch', ...)
    
class GeoFence(TenantEntity):
    # ADD:
    branch = models.ForeignKey('authentication.Branch', ...)
    
class AttendancePunch(TenantEntity):
    # ADD:
    branch = models.ForeignKey('authentication.Branch', ...)
    
class AttendanceRecord(TenantEntity):
    # ADD:
    branch = models.ForeignKey('authentication.Branch', ...)
```

#### 2.3 Asset Models
**Why**: Assets are physically located at branches
**File**: `apps/assets/models.py`

```python
class Asset(TenantEntity):
    # ADD:
    branch = models.ForeignKey(
        'authentication.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Branch where asset is located'
    )
```

### Priority 2: Leave & Payroll

#### 2.4 Leave Models
```python
class LeaveRequest(TenantEntity):
    # ADD: branch from employee's branch
    branch = models.ForeignKey('authentication.Branch', ...)
    
class LeaveApproval(TenantEntity):
    # ADD: approver's branch
    branch = models.ForeignKey('authentication.Branch', ...)
```

#### 2.5 Payroll Models
```python
class PayrollRun(TenantEntity):
    # ADD: for branch-wise payroll
    branch = models.ForeignKey(
        'authentication.Branch',
        null=True,  # null = organization-wide payroll
        blank=True
    )
```

### Priority 3: Recruitment

#### 2.6 Recruitment Models
```python
class JobPosting(TenantEntity):
    # ADD: job is for specific branch
    branch = models.ForeignKey('authentication.Branch', ...)
    
class Interview(TenantEntity):
    # ADD: interview at specific branch
    branch = models.ForeignKey('authentication.Branch', ...)
```

---

## PHASE 3: ADMIN CLASS UPDATES

### Pattern for All Admin Classes

```python
from apps.authentication.models_hierarchy import Branch

class MyModelAdmin(admin.ModelAdmin):
    list_display = [..., 'branch', 'organization']
    list_filter = [..., 'branch__organization', 'branch']
    
    def get_queryset(self, request):
        """Filter by organization for org admins"""
        qs = super().get_queryset(request)
        
        if request.user.is_superuser:
            return qs
        
        user_org = request.user.get_organization()
        if user_org:
            return qs.filter(organization=user_org)
        
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter branch choices by org admin's organization"""
        if db_field.name == 'branch' and not request.user.is_superuser:
            user_org = request.user.get_organization()
            if user_org:
                kwargs['queryset'] = Branch.objects.filter(organization=user_org)
        
        if db_field.name == 'organization' and not request.user.is_superuser:
            user_org = request.user.get_organization()
            if user_org:
                from apps.core.models import Organization
                kwargs['queryset'] = Organization.objects.filter(id=user_org.id)
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
```

---

## MIGRATION STRATEGY

### Step 1: Create Migrations
```bash
# Phase 1
python manage.py makemigrations authentication  # UserSession
python manage.py makemigrations billing         # BankDetails

# Phase 2 (per priority)
python manage.py makemigrations employees
python manage.py makemigrations attendance
python manage.py makemigrations assets
python manage.py makemigrations leave
python manage.py makemigrations payroll
python manage.py makemigrations recruitment
```

### Step 2: Data Migration Pattern
```python
# For each model with new branch field
def populate_branch_from_employee(apps, schema_editor):
    """
    For models that reference employee:
    Auto-populate branch from employee's branch
    """
    Model = apps.get_model('app_name', 'ModelName')
    for obj in Model.objects.filter(branch__isnull=True):
        if hasattr(obj, 'employee') and obj.employee and obj.employee.branch:
            obj.branch = obj.employee.branch
            obj.save(update_fields=['branch'])
```

### Step 3: Make Non-Nullable (After Data Migration)
```python
# Once all data is populated, make field non-nullable
operations = [
    migrations.AlterField(
        model_name='modelname',
        name='branch',
        field=models.ForeignKey(..., null=False),  # Remove null=True
    ),
]
```

---

## TESTING CHECKLIST

### Unit Tests
- [ ] Test organization filtering in querysets
- [ ] Test branch filtering in admin
- [ ] Test cascade on branch delete
- [ ] Test branch assignment validation

### Integration Tests
- [ ] Org admin can only see their org's data
- [ ] Org admin can only select branches from their org
- [ ] Superuser sees all branches
- [ ] API endpoints filter by branch correctly

### Admin Tests
- [ ] Login as superuser - see all
- [ ] Login as org admin - see only org data
- [ ] Create record with branch - auto-filtered choices
- [ ] Edit record - branch dropdown shows only org's branches

---

## ROLLBACK PLAN

### If Issues Found

**Phase 1 Rollback:**
```bash
python manage.py migrate authentication <previous_migration>
python manage.py migrate billing <previous_migration>
```

**Phase 2 Rollback:**
```bash
# Revert each app individually
python manage.py migrate employees <previous_migration>
# ... etc
```

**Database Backup:**
```bash
# BEFORE starting migrations
pg_dump hrms_db > backup_before_branch_impl.sql
```

---

## PERFORMANCE CONSIDERATIONS

### Database Indexes
All branch ForeignKeys already include `db_index=True`

**Additional indexes needed:**
```python
class Meta:
    indexes = [
        models.Index(fields=['organization', 'branch', 'created_at']),
        models.Index(fields=['branch', 'is_active']),
    ]
```

### Query Optimization
```python
# Use select_related for branch
queryset = Model.objects.select_related('branch', 'branch__organization')

# Use prefetch_related for reverse relations
branches = Branch.objects.prefetch_related('employees', 'assets')
```

---

## IMPLEMENTATION TIMELINE

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 0 | Deep Analysis | 1h | ✅ DONE |
| 1.1 | UserSession organization | 15m | ⏳ READY |
| 1.2 | BankDetails organization | 15m | ⏳ READY |
| 1.3 | Migrations & Testing | 30m | ⏳ READY |
| 2.1 | Employee branch | 30m | 📋 PLANNED |
| 2.2 | Attendance branch | 1h | 📋 PLANNED |
| 2.3 | Asset branch | 30m | 📋 PLANNED |
| 2.4 | Leave branch | 45m | 📋 PLANNED |
| 2.5 | Payroll branch | 30m | 📋 PLANNED |
| 2.6 | Recruitment branch | 30m | 📋 PLANNED |
| 3 | Admin updates | 2h | 📋 PLANNED |
| 4 | Testing | 1h | 📋 PLANNED |

**Total Estimated Time:** 7-8 hours

---

## NEXT STEPS

Ready to proceed with Phase 1?

1. Add organization to UserSession
2. Change BankDetails to use OrganizationEntity
3. Generate migrations
4. Test in development
5. Move to Phase 2 (branch implementation)

Await your approval to proceed! 🚀
