# Organization & Branch Implementation Plan

## Analysis Summary

**Total Models Analyzed:** 121
**Models with Organization:** 95 (78.5%)
**Models WITHOUT Organization:** 26 (21.5%)
**Models with Branch:** 1 (BranchUser)
**Models that NEED Branch:** ~40 operational models

---

## ✅ Models ALREADY Having Organization

These models already inherit from `OrganizationEntity` or `TenantEntity`:
- **ai_services**: AIModelVersion, AIPrediction  
- **assets**: Asset, AssetAssignment, AssetCategory
- **attendance**: ALL models (AttendancePunch, AttendanceRecord, FaceEmbedding, FraudLog, GeoFence, Shift)
- **authentication**: Branch, OrganizationUser, User
- **billing**: Subscription (only)
- **chat**: ALL models
- **compliance**: ALL models
- **employees**: ALL models (20 models)
- **expenses**: ALL models
- **integrations**: ALL models
- **leave**: ALL models (10 models)
- **notifications**: ALL models
- **onboarding**: ALL models
- **payroll**: ALL models (8 models)
- **performance**: ALL models (12 models)
- **recruitment**: ALL models
- **reports**: ALL models
- **workflows**: ALL models

---

## ❌ Models MISSING Organization (Need Fix)

### 1. **ABAC App** (All 10 models - System-level, NO org needed)
- AttributeType, Policy, PolicyRule, UserPolicy, GroupPolicy
- PolicyLog, Role, UserRole, Permission, RolePermission

**Action:** ✅ **NO ACTION** - These are system-wide ABAC policies, should remain global.

### 2. **Authentication App**
- ❌ **UserSession** - Should have organization (user sessions belong to org users)
- ❌ **PasswordResetToken** - NO org needed (user-level)
- ❌ **EmailVerificationToken** - NO org needed (user-level)

**Action:**
- Add organization to UserSession
- Keep tokens global (user-level)

### 3. **Billing App**
- ❌ **Plan** - Global (superadmin only)
- ❌ **Invoice** - Should have organization (via subscription FK)
- ❌ **Payment** - Should have organization (via invoice FK)
- ❌ **BankDetails** - Should have organization

**Action:**
- Keep Plan global
- Add organization to: BankDetails, Invoice, Payment

### 4. **Core App**
- ❌ **Organization** - Root model, no org field needed
- ❌ **AuditLog** - System-wide logs
- ❌ **FeatureFlag** - System-wide flags

**Action:** ✅ **NO ACTION** - These are global system models.

---

## 🌿 Models That NEED Branch Field

**Operational Models** (activities happen at branch level):

### High Priority (Branch-Specific Operations)
1. **attendance.Shift** - Shifts are branch-specific
2. **attendance.GeoFence** - Geofencing is branch-specific
3. **attendance.AttendancePunch** - Punches happen at a branch
4. **attendance.AttendanceRecord** - Daily records are branch-specific
5. **assets.Asset** - Assets are located at branches
6. **assets.AssetAssignment** - Asset assignments to branch employees
7. **employees.Employee** - Employees work at specific branches
8. **employees.Department** - Departments can be branch-specific
9. **employees.Location** - Locations ARE branches (might need refactor)
10. **leave.LeaveRequest** - Leave requests from branch employees
11. **leave.LeaveApproval** - Approvals by branch managers
12. **leave.Holiday** - Holidays can be branch-specific
13. **payroll.PayrollRun** - Payroll can be branch-specific
14. **recruitment.JobPosting** - Jobs are for specific branches
15. **recruitment.Interview** - Interviews at specific branches

### Medium Priority (Branch-Aware)
16. **expenses.ExpenseClaim** - Claims from branch employees
17. **expenses.EmployeeAdvance** - Advances from branch employees
18. **onboarding.EmployeeOnboarding** - Onboarding at specific branch
19. **performance.PerformanceReview** - Reviews by branch managers
20. **chat.Conversation** - Branch-level team chats

### Low Priority (Optional Branch Context)
21. **employees.EmployeePromotion** - Branch transfers
22. **employees.EmployeeTransfer** - Cross-branch transfers
23. **payroll.EmployeeSalary** - Branch-wise salary structures
24. **notifications.Notification** - Branch-level notifications

---

## Implementation Strategy

### Phase 1: Add Organization to Missing Models ✅
**Models:**
- authentication.UserSession
- billing.BankDetails
- billing.Invoice (via subscription)
- billing.Payment (via invoice)

### Phase 2: Add Branch to Core Operational Models 🌿
**Priority 1 - Employee & Attendance:**
- employees.Employee
- employees.Department
- attendance.Shift
- attendance.GeoFence
- attendance.AttendancePunch
- attendance.AttendanceRecord

**Priority 2 - Assets & Leave:**
- assets.Asset
- assets.AssetAssignment
- leave.LeaveRequest
- leave.LeaveApproval
- leave.Holiday

**Priority 3 - Payroll & Recruitment:**
- payroll.PayrollRun
- recruitment.JobPosting
- recruitment.Interview

### Phase 3: Update Admin Classes
- Add branch filtering in admin queries
- Add branch field in forms
- Update permissions for branch-level access

### Phase 4: Create Migrations
- Generate migrations for all model changes
- Test migrations on development database
- Create rollback plan

---

## Technical Implementation

### Adding Organization Field
```python
from apps.core.models import OrganizationEntity

# Change from:
class MyModel(EnterpriseModel):
    # fields

# To:
class MyModel(OrganizationEntity):
    # fields - organization auto-added
```

### Adding Branch Field
```python
from apps.authentication.models_hierarchy import Branch

class MyModel(OrganizationEntity):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='%(class)s_set',
        db_index=True,
        null=True,  # Initially nullable for migration
        blank=True,
        help_text='Branch where this record belongs'
    )
```

### Admin Updates
```python
class MyModelAdmin(admin.ModelAdmin):
    list_display = [..., 'branch', 'organization']
    list_filter = [..., 'branch', 'organization']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        user_org = request.user.get_organization()
        if user_org:
            return qs.filter(organization=user_org)
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'branch' and not request.user.is_superuser:
            user_org = request.user.get_organization()
            if user_org:
                from apps.authentication.models_hierarchy import Branch
                kwargs['queryset'] = Branch.objects.filter(organization=user_org)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
```

---

## Execution Timeline

1. **Phase 1** - Add Organization (30 mins)
2. **Phase 2.1** - Add Branch to Employee/Attendance (1 hour)
3. **Phase 2.2** - Add Branch to Assets/Leave (1 hour)
4. **Phase 2.3** - Add Branch to Payroll/Recruitment (1 hour)
5. **Phase 3** - Update Admin Classes (2 hours)
6. **Phase 4** - Migrations & Testing (1 hour)

**Total Estimated Time: 6-7 hours**

---

## Risks & Mitigation

### Risk 1: Data Loss in Production
**Mitigation:** 
- All branch fields are nullable initially
- Provide data migration scripts to populate branches
- Test thoroughly in staging

### Risk 2: Performance Impact
**Mitigation:**
- Add database indexes on branch fields
- Use select_related() and prefetch_related() in queries

### Risk 3: Broken Queries
**Mitigation:**
- Update all querysets to filter by branch
- Add branch context middleware
- Test all API endpoints

---

## Next Steps

1. ✅ Review and approve this plan
2. Start with Phase 1 (organization fields)
3. Run migrations in development
4. Test admin interface
5. Move to Phase 2 (branch fields)
6. Deploy to staging
7. Production deployment with rollback plan
