# Branch Implementation Testing Guide

## Overview
Comprehensive testing guide for the hierarchical multi-tenancy branch implementation.

## Test Coverage

### 1. Unit Tests

#### Branch Permissions (`test_branch_permissions.py`)
```bash
# Run branch permission tests
pytest apps/core/tests/test_branch_permissions.py -v

# Run specific test class
pytest apps/core/tests/test_branch_permissions.py::BranchPermissionTestCase -v
```

**Test Cases:**
- ✅ Superuser has access to all branches
- ✅ Org admin has access to all branches in their organization
- ✅ Branch user has access to their own branch
- ✅ Branch user denied access to other branches
- ✅ User with no branch assignment denied

#### Branch Filtering (`test_branch_permissions.py`)
```bash
# Run filter backend tests
pytest apps/core/tests/test_branch_permissions.py::BranchFilterBackendTestCase -v
```

**Test Cases:**
- ✅ Superuser sees all records
- ✅ Branch user sees only their branch records
- ✅ Org admin sees all branches in org

#### Branch Selector API (`test_branch_permissions.py`)
```bash
# Run branch selector tests
pytest apps/core/tests/test_branch_permissions.py::TestBranchSelectorAPI -v
```

**Test Cases:**
- ✅ User can get their accessible branches
- ✅ User can switch to an authorized branch
- ✅ User cannot switch to unauthorized branch
- ✅ Current branch is tracked in session

### 2. Integration Tests

#### API Endpoint Testing
```bash
# Run all API integration tests
pytest apps/core/tests/test_branch_permissions.py::BranchAPIIntegrationTestCase -v
```

**Test Cases:**
- ✅ Employee list filtered by branch
- ✅ Cannot access other branch employee detail
- ✅ Superuser sees all branches

#### Admin Interface Testing (Manual)

**Test Scenarios:**

1. **Superuser Access**
   ```
   Login as: superuser
   Navigate to: /admin/employees/employee/
   Expected: See all employees from all branches
   Verify: Branch filter dropdown shows all branches
   ```

2. **Org Admin Access**
   ```
   Login as: org_admin@test.com
   Navigate to: /admin/employees/employee/
   Expected: See employees from all branches in their org
   Verify: Cannot see employees from other organizations
   ```

3. **Branch User Access**
   ```
   Login as: branch_user@test.com
   Navigate to: /admin/employees/employee/
   Expected: See only employees from their branch
   Verify: Branch filter shows only their branch
   ```

### 3. API Endpoint Tests (curl/Postman)

#### Get My Branches
```bash
curl -X GET http://localhost:8000/api/v1/auth/branches/my-branches/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "branches": [
    {
      "id": "uuid",
      "name": "Branch 1",
      "code": "BR1",
      "type": "branch",
      "location": "Location Name",
      "is_headquarters": false
    }
  ],
  "current_branch": {
    "id": "uuid",
    "name": "Branch 1",
    "code": "BR1"
  },
  "is_multi_branch": false,
  "organization": {
    "id": "uuid",
    "name": "Org Name"
  }
}
```

#### Switch Branch
```bash
curl -X POST http://localhost:8000/api/v1/auth/branches/switch-branch/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branch_id": "BRANCH_UUID"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Switched to branch: Branch 1",
  "branch": {
    "id": "uuid",
    "name": "Branch 1",
    "code": "BR1",
    "type": "branch",
    "location": "Location Name"
  }
}
```

#### Get Current Branch
```bash
curl -X GET http://localhost:8000/api/v1/auth/branches/current-branch/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Employee List (Branch Filtered)
```bash
curl -X GET http://localhost:8000/api/v1/employees/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify:**
- Only employees from user's branch(es) returned
- Switching branch changes results

#### Attendance Records (Branch Filtered)
```bash
curl -X GET http://localhost:8000/api/v1/attendance/shifts/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Verify:**
- Only shifts from user's branch returned

#### Asset Management (Branch Filtered)
```bash
curl -X GET http://localhost:8000/api/v1/assets/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Data Migration Testing

#### Dry Run Test
```bash
# Test migration without making changes
python manage.py populate_branch_fields --dry-run

# Expected output shows:
# - Organizations with single vs multiple branches
# - Records that would be updated
# - Records that need manual review
```

#### Single Organization Test
```bash
# Test specific organization
python manage.py populate_branch_fields --organization ORG_UUID --dry-run
```

#### Auto-Assign Test
```bash
# Auto-assign for single-branch organizations
python manage.py populate_branch_fields --auto-assign --dry-run
```

#### Full Migration
```bash
# Execute actual migration
python manage.py populate_branch_fields --auto-assign

# Verify records updated
python manage.py shell
>>> from apps.employees.models import Employee
>>> Employee.objects.filter(branch__isnull=True).count()
# Should be 0 or very low
```

### 5. Performance Testing

#### Queryset Efficiency
```python
# In Django shell
from django.db import connection
from django.test.utils import override_settings
from apps.employees.models import Employee

# Enable query logging
import logging
logger = logging.getLogger('django.db.backends')
logger.setLevel(logging.DEBUG)

# Test query count
with connection.cursor():
    employees = Employee.objects.all()
    list(employees)  # Force evaluation
    
# Verify:
# - Single query with JOIN on branch
# - No N+1 queries
```

### 6. Security Testing

#### Branch Isolation Test
```bash
# Create two users in different branches
# User A in Branch 1, User B in Branch 2

# Login as User A
# Get Employee ID from Branch 2
# Try to access: GET /api/v1/employees/{branch2_employee_id}/

# Expected: 403 Forbidden or 404 Not Found
```

#### Permission Escalation Test
```bash
# Try to modify permission_classes to bypass BranchPermission
# Expected: Should not be possible without code changes
```

## Test Execution Checklist

### Phase 1: Unit Tests
- [ ] Run pytest for branch permissions
- [ ] Run pytest for branch filtering  
- [ ] Run pytest for branch selector API
- [ ] Verify all tests pass

### Phase 2: Admin Testing
- [ ] Login as superuser - verify sees all branches
- [ ] Login as org admin - verify sees org branches only
- [ ] Login as branch user - verify sees own branch only
- [ ] Test branch filter dropdown
- [ ] Test creating new employee (branch field required)

### Phase 3: API Testing
- [ ] Test /branches/my-branches/ endpoint
- [ ] Test /branches/switch-branch/ endpoint
- [ ] Test /branches/current-branch/ endpoint
- [ ] Test employee list filtering
- [ ] Test attendance list filtering
- [ ] Test asset list filtering
- [ ] Test leave list filtering
- [ ] Verify cannot access other branch data

### Phase 4: Data Migration
- [ ] Run dry-run for all organizations
- [ ] Review output for single-branch orgs
- [ ] Review output for multi-branch orgs
- [ ] Execute migration with --auto-assign
- [ ] Verify branch fields populated
- [ ] Check for null branch values

### Phase 5: Integration Testing
- [ ] Create test organization with 2 branches
- [ ] Create users in each branch
- [ ] Create employees in each branch
- [ ] Verify cross-branch isolation
- [ ] Test org admin can see both branches
- [ ] Test branch user sees only own branch

### Phase 6: Performance Testing
- [ ] Measure query count for employee list
- [ ] Test with 1000+ employees
- [ ] Verify no N+1 queries
- [ ] Test filter performance

## Expected Results

### Unit Tests
```
============================= test session starts ==============================
collected 15 items

apps/core/tests/test_branch_permissions.py::BranchPermissionTestCase::test_superuser_has_permission PASSED
apps/core/tests/test_branch_permissions.py::BranchPermissionTestCase::test_org_admin_has_permission PASSED
apps/core/tests/test_branch_permissions.py::BranchPermissionTestCase::test_branch_user_has_permission_own_branch PASSED
apps/core/tests/test_branch_permissions.py::BranchPermissionTestCase::test_branch_user_no_permission_other_branch PASSED
...
============================== 15 passed in 5.23s ==============================
```

### Data Migration
```
Organization: Test Org (single branch)
  Branch: Main Branch
  - Employees: 15 records → auto-assigned
  - Departments: 3 records → auto-assigned
  - Attendance: 245 records → auto-assigned
  
Total Updated: 263 records
Total Skipped: 0 records
Total Manual Review: 0 records
```

## Troubleshooting

### Issue: Tests Fail - No Branch Access
**Solution:**
```python
# Ensure BranchUser mapping exists
BranchUser.objects.create(branch=branch, user=user, is_active=True)
```

### Issue: API Returns Empty Results
**Solution:**
```python
# Check user has organization membership
OrganizationUser.objects.create(organization=org, user=user, is_active=True)
```

### Issue: Migration Fails - Multiple Branches
**Solution:**
```bash
# Review organizations with multiple branches
# Manually assign branches or use specific --organization flag
python manage.py populate_branch_fields --organization ORG_UUID --dry-run
```

## Continuous Testing

### Pre-Deployment Checklist
```bash
# Run all tests
pytest apps/core/tests/ -v

# Check for errors
python manage.py check

# Run migrations
python manage.py migrate

# Verify static files
python manage.py collectstatic --noinput

# Test API endpoints
curl http://localhost:8000/api/v1/auth/branches/my-branches/ -H "Authorization: Bearer TOKEN"
```

### Post-Deployment Verification
1. Login to admin interface
2. Verify branch filtering works
3. Test API endpoints
4. Verify branch switching works
5. Check error logs

## Success Criteria

✅ All unit tests pass  
✅ Admin filtering works correctly  
✅ API endpoints respect branch boundaries  
✅ Branch switching works  
✅ Data migration completes successfully  
✅ No cross-branch data leakage  
✅ Performance acceptable (< 100ms per request)  
✅ No security vulnerabilities
