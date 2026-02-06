# Hierarchical Multi-Tenancy Implementation Guide

## Overview
Complete refactoring from direct FK relationships to mapping-based hierarchical multi-tenancy.

**Architecture:**
```
Organization (Pure Entity)
    ↓
OrganizationUser (User ↔ Organization Mapping with Role)
    ↓
User (Global Identity)
    ↓
BranchUser (User ↔ Branch Mapping with Role)
    ↓
Branch (Physical Location/Division)
```

## Key Changes

### 1. Models Created
- **OrganizationUser**: User-to-Organization mapping with role (ORG_ADMIN, EMPLOYEE)
- **Branch**: Physical locations under Organization
- **BranchUser**: User-to-Branch mapping with role (BRANCH_ADMIN, EMPLOYEE)

### 2. User Model Changes
- **KEPT**: `organization` field (for backward compatibility during transition)
- **ADDED**: Helper methods for hierarchical access:
  - `get_organization_membership()` → OrganizationUser instance
  - `get_organization()` → Organization instance via mapping
  - `is_organization_admin()` → Check ORG_ADMIN role via mapping
  - `get_branch_memberships()` → All BranchUser instances
  - `get_branches()` → All Branch instances user is assigned to
  - `is_branch_admin_for(branch)` → Check BRANCH_ADMIN role for specific branch

### 3. Key Features
- **One Organization Per User**: Enforced at model level via `unique_together` and `clean()` validation
- **Multiple Branches Per User**: User can be assigned to many branches within their organization
- **Role-Based**: Separate roles at org level (ORG_ADMIN, EMPLOYEE) and branch level (BRANCH_ADMIN, EMPLOYEE)
- **Hierarchical Validation**: BranchUser validates that branch belongs to user's organization

## Implementation Steps

### Step 1: Apply Migrations
```bash
cd backend
python manage.py makemigrations authentication
python manage.py migrate
```

This creates:
- `organization_users` table
- `branches` table  
- `branch_users` table

### Step 2: Migrate Existing Data
```bash
# Dry run to preview changes
python manage.py migrate_organization_to_mapping --dry-run

# Execute migration
python manage.py migrate_organization_to_mapping
```

This migrates:
- `User.organization` → `OrganizationUser.organization`
- `User.is_org_admin` → `OrganizationUser.role` (ORG_ADMIN or EMPLOYEE)

### Step 3: Switch to New Admin Interface
Replace current admin registration with hierarchical admin:

**In `apps/authentication/admin.py`:**
```python
# Comment out old admin
# from .admin import UserAdmin

# Use new hierarchical admin
from .admin_hierarchy import (
    UserAdminHierarchy,
    OrganizationUserAdmin,
    BranchAdmin,
    BranchUserAdmin
)
```

Or rename files:
```bash
mv backend/apps/authentication/admin.py backend/apps/authentication/admin_old.py
mv backend/apps/authentication/admin_hierarchy.py backend/apps/authentication/admin.py
```

### Step 4: Update Application Code

#### Old Code (Direct FK):
```python
# Getting user's organization
user_org = user.organization

# Checking if org admin
if user.is_org_admin:
    pass

# Filtering by organization
queryset = Model.objects.filter(organization=user.organization)
```

#### New Code (Mapping-Based):
```python
# Getting user's organization
user_org = user.get_organization()

# Checking if org admin
if user.is_organization_admin():
    pass

# Filtering by organization
user_org = user.get_organization()
if user_org:
    queryset = Model.objects.filter(organization=user_org)
```

### Step 5: Update Permission Mixins

**Old `OrgAdminMixin` (in `apps/core/org_permissions.py`):**
```python
def get_queryset(self, request):
    qs = super().get_queryset(request)
    if request.user.is_superuser:
        return qs
    return qs.filter(organization=request.user.organization)
```

**New `OrgAdminMixin`:**
```python
def get_queryset(self, request):
    qs = super().get_queryset(request)
    if request.user.is_superuser:
        return qs
    
    user_org = request.user.get_organization()
    if user_org:
        return qs.filter(organization=user_org)
    return qs.none()
```

### Step 6: Update Serializers

**Example User Serializer:**
```python
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    organization = serializers.SerializerMethodField()
    organization_role = serializers.SerializerMethodField()
    branches = serializers.SerializerMethodField()
    
    def get_organization(self, obj):
        org = obj.get_organization()
        return {'id': str(org.id), 'name': org.name} if org else None
    
    def get_organization_role(self, obj):
        membership = obj.get_organization_membership()
        return membership.get_role_display() if membership else None
    
    def get_branches(self, obj):
        branches = obj.get_branches()
        return [{'id': str(b.id), 'name': b.name} for b in branches]
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 
            'organization', 'organization_role',
            'branches', ...
        ]
```

### Step 7: Create Organizations & Branches in Admin
1. Login to Django admin as superuser
2. Navigate to **Authentication** > **Organizations Users**
   - Verify all users have organization assignments
3. Navigate to **Authentication** > **Branches**
   - Create branches for each organization
4. Navigate to **Authentication** > **Branch Users**
   - Assign users to branches

### Step 8: Update Tests

**Test user creation with organization:**
```python
from apps.authentication.models import User
from apps.authentication.models_hierarchy import OrganizationUser
from apps.core.models import Organization

# Create organization
org = Organization.objects.create(name='Test Org')

# Create user (no direct organization field)
user = User.objects.create_user(
    email='test@example.com',
    password='testpass',
    first_name='Test',
    last_name='User'
)

# Assign user to organization
org_user = OrganizationUser.objects.create(
    user=user,
    organization=org,
    role=OrganizationUser.RoleChoices.ORG_ADMIN
)

# Verify
assert user.get_organization() == org
assert user.is_organization_admin() == True
```

## API Examples

### 1. Get User's Organization
```python
user_org = request.user.get_organization()
if user_org:
    print(f"User belongs to: {user_org.name}")
```

### 2. Get User's Role in Organization
```python
membership = request.user.get_organization_membership()
if membership:
    print(f"Role: {membership.get_role_display()}")
    print(f"Is Admin: {membership.role == OrganizationUser.RoleChoices.ORG_ADMIN}")
```

### 3. Get User's Branches
```python
branches = request.user.get_branches()
for branch in branches:
    print(f"Assigned to: {branch.name}")
```

### 4. Check Branch Admin Status
```python
branch = Branch.objects.get(name='Main Office')
if request.user.is_branch_admin_for(branch):
    print("User is admin of Main Office")
```

### 5. Get Branches Where User is Admin
```python
admin_branches = request.user.get_admin_branches()
for branch in admin_branches:
    print(f"Admin of: {branch.name}")
```

## Backward Compatibility

The `User.organization` field is **KEPT** for backward compatibility but should be considered **deprecated**.

### Transition Strategy:
1. **Phase 1** (Current): Both systems coexist
   - Use `get_organization()` in new code
   - Old code using `user.organization` still works
   
2. **Phase 2** (After full migration): Update all code
   - Replace all `user.organization` with `user.get_organization()`
   - Replace all `user.is_org_admin` with `user.is_organization_admin()`

3. **Phase 3** (Future): Remove deprecated fields
   - Mark `User.organization` as deprecated in model
   - Add migration to remove field (after confirming zero usage)

## Django Admin Features

### User Admin
- Shows organization via inline `OrganizationUser` editor
- Shows branches via inline `BranchUser` editor
- Org admins can only see users in their organization
- Superusers can assign users to any organization

### OrganizationUser Admin
- Manage user-to-organization assignments
- Set role (ORG_ADMIN or EMPLOYEE)
- Enforces one-organization-per-user rule

### Branch Admin
- Create/manage branches under organizations
- Org admins can only manage branches in their organization

### BranchUser Admin
- Assign users to branches
- Set branch-level roles
- Validates user and branch belong to same organization

## Validation Rules

### OrganizationUser
- ✅ User can belong to only ONE organization (enforced)
- ✅ Unique constraint: (user, organization)
- ✅ Validation in `clean()` method

### BranchUser
- ✅ User can belong to MULTIPLE branches
- ✅ Branch must belong to user's organization (enforced)
- ✅ Unique constraint: (user, branch)
- ✅ Validation in `clean()` method

## Troubleshooting

### Issue: Migration fails with FK constraint errors
**Solution:** Run migrations in correct order:
```bash
python manage.py migrate authentication 0001  # Base tables
python manage.py migrate authentication       # New tables
python manage.py migrate_organization_to_mapping
```

### Issue: Users can't see any data after migration
**Solution:** Verify OrganizationUser records exist:
```bash
python manage.py shell
>>> from apps.authentication.models import User
>>> from apps.authentication.models_hierarchy import OrganizationUser
>>> for user in User.objects.filter(organization__isnull=False):
...     print(f"{user.email}: {user.get_organization()}")
```

### Issue: "User belongs to multiple organizations" error
**Solution:** This shouldn't happen if migration script ran correctly. If it does:
```python
from apps.authentication.models_hierarchy import OrganizationUser

# Find duplicates
for user in User.objects.all():
    count = OrganizationUser.objects.filter(user=user, is_active=True).count()
    if count > 1:
        print(f"User {user.email} has {count} active org assignments")
        # Manually deactivate extras
```

## Testing Checklist

- [ ] All migrations applied successfully
- [ ] Data migration completed without errors
- [ ] Users can access Django admin
- [ ] Organization assignments visible in admin
- [ ] Branch creation works
- [ ] Branch user assignments work
- [ ] User queryset filtering works for org admins
- [ ] Superusers can see all organizations
- [ ] Permission checks work (org admin, branch admin)
- [ ] API endpoints return correct organization data
- [ ] Existing tests pass or updated
- [ ] New tests written for hierarchical features

## Performance Considerations

### Recommended Indexes (Already Added)
```python
# OrganizationUser
indexes = [
    Index(fields=['user', 'is_active']),
    Index(fields=['organization', 'role', 'is_active']),
]

# BranchUser
indexes = [
    Index(fields=['user', 'is_active']),
    Index(fields=['branch', 'role', 'is_active']),
]
```

### Query Optimization
Always use `select_related()` and `prefetch_related()`:
```python
# Get users with their organizations
users = User.objects.select_related(
    'organization_memberships__organization'
).filter(organization_memberships__is_active=True)

# Get users with branches
users = User.objects.prefetch_related(
    'branch_memberships__branch'
).filter(branch_memberships__is_active=True)
```

## Next Steps

1. ✅ Models created (`models_hierarchy.py`)
2. ✅ User helper methods added
3. ✅ Admin interface created (`admin_hierarchy.py`)
4. ✅ Data migration script created
5. ⏳ Apply migrations
6. ⏳ Run data migration
7. ⏳ Switch admin interface
8. ⏳ Update application code
9. ⏳ Update tests
10. ⏳ Test in development
11. ⏳ Deploy to staging
12. ⏳ Test in staging
13. ⏳ Deploy to production

## Files Created/Modified

### New Files
- `backend/apps/authentication/models_hierarchy.py` - OrganizationUser, Branch, BranchUser models
- `backend/apps/authentication/admin_hierarchy.py` - New admin interface
- `backend/apps/authentication/management/commands/migrate_organization_to_mapping.py` - Data migration script
- `HIERARCHICAL_MULTI_TENANCY_GUIDE.md` - This guide

### Modified Files
- `backend/apps/authentication/models.py` - Added import, helper methods, backward compatibility
- `backend/apps/core/models.py` - Documentation update

### To Be Updated
- `backend/apps/core/org_permissions.py` - Update OrgAdminMixin to use get_organization()
- All serializers using `user.organization`
- All views using `user.is_org_admin`
- All queryset filters using `organization=user.organization`
- Test files

## Support

For issues or questions:
1. Check this guide
2. Review model docstrings in `models_hierarchy.py`
3. Check validation logic in model `clean()` methods
4. Review admin customizations in `admin_hierarchy.py`
