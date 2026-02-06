# Hierarchical Multi-Tenancy Quick Reference

## 🚀 Quick Start

### 1. Apply Migrations
```bash
cd backend
python manage.py makemigrations authentication
python manage.py migrate
```

### 2. Migrate Existing Data
```bash
# Dry run first
python manage.py migrate_organization_to_mapping --dry-run

# Execute
python manage.py migrate_organization_to_mapping
```

### 3. Switch Admin Interface
```bash
cd backend/apps/authentication
mv admin.py admin_old.py
mv admin_hierarchy.py admin.py

cd ../core
mv org_permissions.py org_permissions_old.py
mv org_permissions_hierarchy.py org_permissions.py
```

## 📋 Common Patterns

### Get User's Organization
```python
# New way (use this)
org = user.get_organization()

# Old way (still works but deprecated)
org = user.organization
```

### Check If Org Admin
```python
# New way
if user.is_organization_admin():
    pass

# Old way (still works)
if user.is_org_admin:
    pass
```

### Filter by Organization
```python
# New way
user_org = request.user.get_organization()
if user_org:
    queryset = Model.objects.filter(organization=user_org)

# Old way
queryset = Model.objects.filter(organization=request.user.organization)
```

### Get User's Branches
```python
# Get all branches
branches = user.get_branches()

# Get branch memberships (with roles)
memberships = user.get_branch_memberships()

# Check if branch admin
if user.is_branch_admin_for(branch):
    pass

# Get admin branches
admin_branches = user.get_admin_branches()
```

## 🔑 Key Methods

### User Model
| Method | Returns | Description |
|--------|---------|-------------|
| `get_organization_membership()` | `OrganizationUser` or `None` | Get active org membership |
| `get_organization()` | `Organization` or `None` | Get user's organization |
| `is_organization_admin()` | `bool` | Check if ORG_ADMIN role |
| `get_branch_memberships()` | `QuerySet[BranchUser]` | Get all branch assignments |
| `get_branches()` | `QuerySet[Branch]` | Get all assigned branches |
| `is_branch_admin_for(branch)` | `bool` | Check if BRANCH_ADMIN for branch |
| `get_admin_branches()` | `QuerySet[Branch]` | Get branches where user is admin |

### OrganizationUser Model
| Field | Type | Description |
|-------|------|-------------|
| `user` | FK → User | The user |
| `organization` | FK → Organization | The organization |
| `role` | Choice | ORG_ADMIN or EMPLOYEE |
| `is_active` | Boolean | Active status |

### Branch Model
| Field | Type | Description |
|-------|------|-------------|
| `organization` | FK → Organization | Parent organization |
| `name` | CharField | Branch name |
| `code` | CharField | Branch code |
| `is_active` | Boolean | Active status |

### BranchUser Model
| Field | Type | Description |
|-------|------|-------------|
| `user` | FK → User | The user |
| `branch` | FK → Branch | The branch |
| `role` | Choice | BRANCH_ADMIN or EMPLOYEE |
| `is_active` | Boolean | Active status |

## 🎯 Roles

### Organization Level
- **ORG_ADMIN**: Can manage organization, create users, create branches
- **EMPLOYEE**: Regular user access

### Branch Level
- **BRANCH_ADMIN**: Can manage specific branch
- **EMPLOYEE**: Regular branch access

## ✅ Validation Rules

| Rule | Enforced By |
|------|-------------|
| User can belong to ONE organization only | `OrganizationUser.clean()` + unique constraint |
| User can belong to MULTIPLE branches | Allowed by design |
| Branch must belong to user's organization | `BranchUser.clean()` |
| Unique user-org pair | Unique constraint `(user, organization)` |
| Unique user-branch pair | Unique constraint `(user, branch)` |

## 🔒 Permission Helpers

### Functions
```python
from apps.core.org_permissions_hierarchy import (
    check_org_admin,
    check_same_organization
)

# Check if org admin
if check_org_admin(request.user):
    pass

# Check same org
if check_same_organization(request.user, obj):
    pass
```

### Decorators
```python
from apps.core.org_permissions_hierarchy import org_admin_required

@org_admin_required
def my_view(request):
    pass
```

### Permission Classes
```python
from apps.core.org_permissions_hierarchy import (
    IsOrgAdminOrSuperuser,
    IsOrgAdminOrReadOnly,
    IsOrgMember
)

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOrgAdminOrSuperuser]
```

### Admin Mixin
```python
from apps.core.org_permissions_hierarchy import OrgAdminMixin

@admin.register(MyModel)
class MyModelAdmin(OrgAdminMixin, admin.ModelAdmin):
    pass  # Auto-filters by organization
```

## 🔧 Django Admin

### User Admin
- Organization assignment via **OrganizationUserInline**
- Branch assignments via **BranchUserInline**
- Org admins see only their organization's users
- Superusers see all users

### OrganizationUser Admin
- Manage user-to-organization mappings
- Enforces one-org-per-user rule
- Set ORG_ADMIN or EMPLOYEE role

### Branch Admin
- Create/manage branches
- Org admins see only their branches
- Full CRUD with address/contact info

### BranchUser Admin
- Assign users to branches
- Set BRANCH_ADMIN or EMPLOYEE role
- Validates org-branch-user relationship

## 📊 Serializer Example

```python
class UserSerializer(serializers.ModelSerializer):
    organization = serializers.SerializerMethodField()
    organization_role = serializers.SerializerMethodField()
    branches = serializers.SerializerMethodField()
    
    def get_organization(self, obj):
        org = obj.get_organization()
        if not org:
            return None
        return {
            'id': str(org.id),
            'name': org.name
        }
    
    def get_organization_role(self, obj):
        membership = obj.get_organization_membership()
        if not membership:
            return None
        return membership.get_role_display()
    
    def get_branches(self, obj):
        return [
            {
                'id': str(b.id),
                'name': b.name,
                'code': b.code
            }
            for b in obj.get_branches()
        ]
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name',
            'organization', 'organization_role',
            'branches'
        ]
```

## 🧪 Testing Example

```python
from apps.authentication.models import User
from apps.authentication.models_hierarchy import OrganizationUser, Branch, BranchUser
from apps.core.models import Organization

# Create organization
org = Organization.objects.create(name='Test Org')

# Create user
user = User.objects.create_user(
    email='test@example.com',
    password='testpass',
    first_name='Test',
    last_name='User'
)

# Assign to organization
org_user = OrganizationUser.objects.create(
    user=user,
    organization=org,
    role=OrganizationUser.RoleChoices.ORG_ADMIN
)

# Verify
assert user.get_organization() == org
assert user.is_organization_admin() == True

# Create branch
branch = Branch.objects.create(
    organization=org,
    name='Main Office'
)

# Assign user to branch
branch_user = BranchUser.objects.create(
    user=user,
    branch=branch,
    role=BranchUser.RoleChoices.BRANCH_ADMIN
)

# Verify
assert branch in user.get_branches()
assert user.is_branch_admin_for(branch) == True
```

## 🚨 Common Errors

### "User already assigned to an organization"
```python
# Cause: Trying to create second OrganizationUser for same user
# Solution: Deactivate existing or update role
existing = OrganizationUser.objects.filter(user=user, is_active=True).first()
if existing:
    existing.organization = new_org
    existing.save()
```

### "Branch belongs to different organization"
```python
# Cause: Branch and user's org don't match
# Solution: Ensure user has org before assigning branch
user_org = user.get_organization()
if not user_org:
    raise ValidationError("User must have organization first")
if branch.organization != user_org:
    raise ValidationError("Branch must belong to user's org")
```

## 📁 File Locations

```
backend/apps/authentication/
├── models.py                              # User model (updated)
├── models_hierarchy.py                    # NEW: OrganizationUser, Branch, BranchUser
├── admin.py                               # Use admin_hierarchy.py instead
├── admin_hierarchy.py                     # NEW: Updated admin interface
└── management/commands/
    └── migrate_organization_to_mapping.py # NEW: Data migration

backend/apps/core/
├── org_permissions.py                     # Old version (keep as backup)
└── org_permissions_hierarchy.py           # NEW: Updated permissions

Documentation:
├── HIERARCHICAL_MULTI_TENANCY_GUIDE.md    # Full implementation guide
├── HIERARCHICAL_MULTI_TENANCY_SUMMARY.md  # Implementation summary
├── HIERARCHICAL_MULTI_TENANCY_DIAGRAMS.md # Visual diagrams
└── HIERARCHICAL_MULTI_TENANCY_QUICK_REF.md # This file
```

## 🎬 Deployment Checklist

- [ ] Backup database
- [ ] Run `makemigrations` and `migrate`
- [ ] Run data migration script
- [ ] Verify OrganizationUser records created
- [ ] Switch to new admin interface
- [ ] Test user creation with org assignment
- [ ] Test branch creation
- [ ] Test branch user assignment
- [ ] Update serializers
- [ ] Update views/permissions
- [ ] Run test suite
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production

## 💡 Pro Tips

1. **Always prefetch for performance**:
   ```python
   users = User.objects.prefetch_related(
       'organization_memberships__organization',
       'branch_memberships__branch'
   )
   ```

2. **Use helper methods consistently**:
   ```python
   # Good
   org = user.get_organization()
   
   # Bad (deprecated)
   org = user.organization
   ```

3. **Validate before saving**:
   ```python
   org_user = OrganizationUser(user=user, organization=org)
   org_user.full_clean()  # Validates one-org-per-user
   org_user.save()
   ```

4. **Use inlines in admin** for better UX:
   - OrganizationUserInline
   - BranchUserInline

## 📞 Support

**Documentation**:
- [Full Guide](HIERARCHICAL_MULTI_TENANCY_GUIDE.md)
- [Summary](HIERARCHICAL_MULTI_TENANCY_SUMMARY.md)
- [Diagrams](HIERARCHICAL_MULTI_TENANCY_DIAGRAMS.md)

**Code**:
- Check docstrings in `models_hierarchy.py`
- Review validation in `clean()` methods
- See examples in `admin_hierarchy.py`

---

**Quick Ref Version**: 1.0  
**Last Updated**: January 2024
