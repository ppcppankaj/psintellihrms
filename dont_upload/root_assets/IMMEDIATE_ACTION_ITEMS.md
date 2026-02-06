# 🎯 IMMEDIATE ACTION ITEMS - Organization-Based Multi-Tenancy

## Status: 10/11 Requirements Met - Need Domain Model Updates

---

## 🚨 CRITICAL ISSUES TO RESOLVE

### Issue 1: Domain Models Using Old TenantEntity
**Severity**: 🔴 CRITICAL
**Impact**: Data isolation NOT enforced for business models

**Current Problem**:
```python
# ❌ WRONG - No organization isolation
from apps.core.models import TenantEntity

class Employee(TenantEntity, MetadataModel):
    # Missing: organization FK
    # Missing: OrganizationManager
    # Missing: save() enforcement
```

**Solution**: Switch to OrganizationEntity
```python
# ✅ CORRECT - Full organization isolation
from apps.core.models import OrganizationEntity

class Employee(OrganizationEntity, MetadataModel):
    # Automatically includes:
    # - organization FK (CASCADE, non-nullable)
    # - OrganizationManager (auto-filters)
    # - save() enforces org context
```

---

## 📋 COMPLETE FILE LIST - What Needs To Change

### TIER 1: Core Models (High Priority)

**File 1**: `backend/apps/employees/models.py`
- Line ~7: Change `from apps.core.models import TenantEntity` → `OrganizationEntity`
- Line ~8: Change `class Employee(TenantEntity, MetadataModel):` → `class Employee(OrganizationEntity, MetadataModel):`
- Repeat for: `Department`, `Designation`, `Location`, `EmployeeAddress`, etc.

**File 2**: `backend/apps/payroll/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`
- Affects: `PayrollRun`, `Payslip`, `EmployeeSalary`, `PayrollComponent`

**File 3**: `backend/apps/attendance/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`
- Affects: `AttendanceRecord`, `Shift`, `GeoFence`, `Holiday`

**File 4**: `backend/apps/leave/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`
- Affects: `LeaveRequest`, `LeaveBalance`, `LeaveType`, `LeavePolicy`

### TIER 2: Feature Models (Medium Priority)

**File 5**: `backend/apps/performance/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`
- Affects: `PerformanceReview`, `Goal`, `KPI`

**File 6**: `backend/apps/recruitment/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`
- Affects: `JobPosting`, `Candidate`, `Application`

**File 7**: `backend/apps/assets/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`
- Affects: `Asset`, `AssetAllocation`, `AssetMaintenance`

**File 8**: `backend/apps/expenses/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`
- Affects: `Expense`, `ExpenseCategory`, `ExpensePolicy`

**File 9**: `backend/apps/chat/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`
- Affects: `ChatMessage`, `ChatRoom`, `ChatAttachment`

**File 10**: `backend/apps/billing/models.py`
- Already has explicit `organization` FK? Check and verify
- May already be OrganizationEntity-compliant

**File 11**: `backend/apps/integrations/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`

**File 12**: `backend/apps/compliance/models.py`
- Change base classes from `TenantEntity` → `OrganizationEntity`

---

## ✅ VERIFICATION CHECKLIST

### After Each Model File Change:

1. **Import Check**: Verify import line
   ```python
   from apps.core.models import OrganizationEntity
   ```

2. **Base Class Check**: Verify inheritance
   ```python
   class ModelName(OrganizationEntity, ...other mixins...):
   ```

3. **No Manual organization FK**: Should NOT add manually
   ```python
   # ❌ DON'T DO THIS - Already in OrganizationEntity
   organization = models.ForeignKey(...)
   
   # ✅ ALREADY PROVIDED by OrganizationEntity
   ```

4. **Meta Class**: Verify indexes include organization if needed
   ```python
   class Meta:
       indexes = [
           models.Index(fields=['organization', 'some_field']),
       ]
   ```

5. **Syntax Check**:
   ```bash
   python manage.py check --fail-level WARNING
   ```

---

## 🔧 STEP-BY-STEP IMPLEMENTATION

### Phase 1: Prepare Environment
```bash
cd c:\Users\ruchi\ppcp\hrms\backend

# 1. Check current migrations status
python manage.py showmigrations

# 2. Create migrations (will be empty, just showing the process)
python manage.py makemigrations --dry-run
```

### Phase 2: Update Models (ONE AT A TIME)
```bash
# For each file, edit it and change:
# FROM: from apps.core.models import TenantEntity
# TO:   from apps.core.models import OrganizationEntity

# FROM: class ModelName(TenantEntity, ...):
# TO:   class ModelName(OrganizationEntity, ...):

# File 1: employees/models.py
# Edit the following classes:
#   - Employee
#   - Department
#   - Designation
#   - Location
#   - EmployeeAddress
#   - EmployeeBankAccount
#   - EmergencyContact
#   - Skill
#   - EmploymentHistory
#   - EmployeeTransfer
#   - EmployeePromotion
#   - ResignationRequest
```

### Phase 3: Generate Migrations
```bash
# AFTER all model files are updated:
python manage.py makemigrations

# Review generated migrations:
# Each will show:
#   - AlterModelOptions (add indexes if needed)
#   - RemoveField (for 'tenant' if exists)
#   - AddField (for 'organization' FK)
```

### Phase 4: Apply Migrations
```bash
# Backup database first!
pg_dump hrms_db > backup_$(date +%s).sql

# Then migrate
python manage.py migrate
```

### Phase 5: Verify
```bash
# Check for errors
python manage.py check

# Test organization filtering
python manage.py shell
```

---

## 🧪 TESTING ORGANIZATION ISOLATION

After migrations:

```python
from apps.core.context import get_current_organization, set_current_organization
from apps.employees.models import Employee
from apps.core.models import Organization

# Test 1: Organization filtering works
org1 = Organization.objects.first()
org2 = Organization.objects.last()

set_current_organization(org1)
emp_count_org1 = Employee.objects.count()

set_current_organization(org2)
emp_count_org2 = Employee.objects.count()

# Assert they're different (or at least logic is correct)
print(f"Org1 employees: {emp_count_org1}")
print(f"Org2 employees: {emp_count_org2}")

# Test 2: Bypassing manager
all_emps = Employee.all_objects.count()
print(f"All employees: {all_emps}")
```

---

## 📊 Before & After Comparison

### BEFORE (Schema-Based with TenantEntity)
```
Organization: Tenant (via schema)
  └─ User (tenant assigned)
     └─ Employee (no explicit org FK)
        └─ Department (no explicit org FK)
           └─ Designation (no explicit org FK)

Problem: Data isolation only at schema level
         No explicit organization_id foreign key
         Possible data leakage if schema routing fails
```

### AFTER (Org-Based with OrganizationEntity)
```
Organization (UUID primary key)
  ├─ User (explicit organization FK)
  ├─ Employee (explicit organization FK) → OrganizationEntity
  │  ├─ Department (explicit organization FK) → OrganizationEntity
  │  └─ Designation (explicit organization FK) → OrganizationEntity
  ├─ PayrollRun (explicit organization FK) → OrganizationEntity
  └─ ... all domain models

Guarantee: All queries auto-filtered by organization
           Database-level isolation with FK constraints
           No slug routing (UUID only)
           Cross-org access returns 403 Forbidden
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All models updated to OrganizationEntity
- [ ] Migrations created and tested locally
- [ ] `python manage.py check` passes with no warnings
- [ ] Organization filtering verified in shell
- [ ] Serializers enforce organization on create (audit complete)
- [ ] ViewSets verified to call `super().get_queryset()`

### During Deployment
- [ ] Backup production database
- [ ] Run migrations in order: `python manage.py migrate --plan`
- [ ] Verify no data loss: `SELECT COUNT(*) FROM <each table>`
- [ ] Test one organization's access to ensure isolation works

### Post-Deployment
- [ ] Monitor audit logs for cross-org access attempts
- [ ] Health check: `GET /api/health/` → 200 OK
- [ ] Sample request: `GET /api/v1/employees/` → filtered by user's org only
- [ ] Cross-org test: Login as user from org2, verify cannot access org1 data

---

## ⚠️ ROLLBACK PLAN

If deployment fails:

```bash
# 1. Restore database backup
pg_restore -d hrms_db backup_<timestamp>.sql

# 2. Rollback migrations
python manage.py migrate <app> <before_migration_number>

# 3. Revert code changes (git revert or manually)

# 4. Restart services
docker-compose restart backend
```

---

## 📞 Key Contact Points

**If migration fails**:
1. Check logs: `docker-compose logs backend`
2. Verify database connection: `python manage.py dbshell`
3. Check migration history: `python manage.py showmigrations`

**If organization isolation doesn't work**:
1. Verify context is set: Check middleware logs
2. Verify manager is used: `Employee.objects.all()` should be filtered
3. Test directly: `python manage.py shell` + filtering test

---

## 📝 Documentation to Update

After successful migration:

- [ ] [ARCHITECTURE_COMPLIANCE_CHECK.md](ARCHITECTURE_COMPLIANCE_CHECK.md) - Mark Requirement 5 as COMPLIANT
- [ ] [README.md](README.md) - Add org-based isolation section
- [ ] [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Document organization context
- [ ] [OPERATIONS_QUICK_REFERENCE.md](OPERATIONS_QUICK_REFERENCE.md) - Add troubleshooting section

---

**Last Updated**: 2026-01-28  
**Status**: 🟡 IN PROGRESS (awaiting model updates)  
**Blocker**: Domain model base class migration
