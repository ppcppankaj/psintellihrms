# 🔐 Organization Admin Permissions - Quick Reference

**Created**: January 28, 2026  
**Status**: ✅ ACTIVE

---

## 🎯 What Organization Admins Can Do

Organization Admins (`is_org_admin=True` + `is_staff=True`) have **full control** over their organization's data:

✅ **Users**: Create, view, edit, delete users in their organization  
✅ **Data**: Full access to all organization-scoped models (Employee, Payroll, etc.)  
✅ **Admin Panel**: Access Django admin for their organization  
✅ **Reports**: Generate reports for their organization  
✅ **Settings**: Configure organization settings  

❌ **Cannot Do**:
- Access data from other organizations  
- Modify system-level settings  
- Access superuser-only features  

---

## 📋 Permission Classes Created

### 1. `IsOrgAdminOrSuperuser`
**Usage**: Restrict endpoint to org admins and superusers only

```python
from apps.core.org_permissions import IsOrgAdminOrSuperuser
from rest_framework import viewsets

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOrgAdminOrSuperuser]
    queryset = MyModel.objects.all()
```

**Behavior**:
- ✅ Superusers: Full access to all data
- ✅ Org Admins: Full access to their organization's data only
- ❌ Regular Users: No access

---

### 2. `IsOrgAdminOrReadOnly`
**Usage**: Allow everyone to read, only org admins can write

```python
from apps.core.org_permissions import IsOrgAdminOrReadOnly

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOrgAdminOrReadOnly]
    queryset = MyModel.objects.all()
```

**Behavior**:
- ✅ Superusers: Full read/write access
- ✅ Org Admins: Full read/write access to their organization
- ✅ Regular Users: Read-only access to their organization
- ❌ Cross-org access: Blocked for everyone except superusers

---

### 3. `IsOrgMember`
**Usage**: Any member of an organization can access

```python
from apps.core.org_permissions import IsOrgMember

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOrgMember]
    queryset = MyModel.objects.all()
```

**Behavior**:
- ✅ All authenticated users with an organization
- ✅ Superusers
- ❌ Users without an organization

---

### 4. `OrgAdminMixin` (for Django Admin)
**Usage**: Apply to Django admin classes for org-level filtering

```python
from django.contrib import admin
from apps.core.org_permissions import OrgAdminMixin
from .models import MyModel

@admin.register(MyModel)
class MyModelAdmin(OrgAdminMixin, admin.ModelAdmin):
    list_display = ['name', 'organization', 'created_at']
```

**Behavior**:
- ✅ Superusers: See all organizations' data
- ✅ Org Admins: See only their organization's data
- ✅ Auto-filters querysets by organization
- ✅ Auto-assigns organization on object creation
- ✅ Filters foreign key choices by organization

---

## 🔧 Helper Methods Added to User Model

### `user.can_manage_organization()`
```python
if request.user.can_manage_organization():
    # Allow organization management
    pass
```

### `user.can_manage_users()`
```python
if request.user.can_manage_users():
    # Allow user creation/editing
    pass
```

### `user.can_access_admin()`
```python
if request.user.can_access_admin():
    # Allow Django admin access
    pass
```

### `user.is_in_same_organization(obj)`
```python
employee = Employee.objects.get(id=123)
if request.user.is_in_same_organization(employee):
    # Allow access
    pass
```

---

## 📚 Examples

### Example 1: API ViewSet with Org Admin Permission
```python
from rest_framework import viewsets
from apps.core.org_permissions import IsOrgAdminOrSuperuser
from .models import Department
from .serializers import DepartmentSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Department management - Org admins can CRUD departments
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsOrgAdminOrSuperuser]
```

### Example 2: Mixed Permissions
```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.org_permissions import IsOrgMember, IsOrgAdminOrSuperuser

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    
    def get_permissions(self):
        """
        - List/Retrieve: Any org member
        - Create/Update/Delete: Org admin only
        """
        if self.action in ['list', 'retrieve']:
            return [IsOrgMember()]
        return [IsOrgAdminOrSuperuser()]
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrgAdminOrSuperuser])
    def promote(self, request, pk=None):
        """Only org admins can promote employees"""
        employee = self.get_object()
        # Promotion logic
        return Response({'status': 'promoted'})
```

### Example 3: Django Admin with Org Filtering
```python
from django.contrib import admin
from apps.core.org_permissions import OrgAdminMixin
from .models import Employee, Department

@admin.register(Employee)
class EmployeeAdmin(OrgAdminMixin, admin.ModelAdmin):
    list_display = ['full_name', 'email', 'organization', 'department']
    list_filter = ['department', 'employment_status']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    
    # OrgAdminMixin automatically:
    # - Filters queryset by organization
    # - Restricts foreign key choices to same org
    # - Auto-assigns organization on save
    # - Checks permissions per-object
```

### Example 4: Function-Based View with Decorator
```python
from django.http import JsonResponse
from apps.core.org_permissions import org_admin_required

@org_admin_required
def delete_department(request, department_id):
    """Only org admins can delete departments"""
    department = Department.objects.get(id=department_id)
    
    # Check same organization
    if not request.user.is_in_same_organization(department):
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    department.delete()
    return JsonResponse({'status': 'deleted'})
```

---

## 🔒 Security Features

### 1. **Automatic Organization Filtering**
```python
# When org admin is logged in:
departments = Department.objects.all()
# Automatically filtered to their organization only
```

### 2. **Cross-Organization Access Prevention**
```python
# Org admin from Company A trying to access Company B's data:
employee = Employee.objects.get(id=999)  # From Company B
if not request.user.is_in_same_organization(employee):
    raise PermissionDenied("Cannot access other organization's data")
```

### 3. **Object-Level Permissions**
```python
# Automatically checked in has_object_permission:
# - Superusers: Can access any object
# - Org Admins: Can only access objects from their organization
# - Regular Users: Based on additional permission checks
```

---

## 📊 Permission Matrix

| Action | Superuser | Org Admin | Regular User | No Organization |
|--------|-----------|-----------|--------------|-----------------|
| View all orgs data | ✅ | ❌ | ❌ | ❌ |
| View own org data | ✅ | ✅ | ✅ | ❌ |
| Create users | ✅ | ✅ | ❌ | ❌ |
| Edit own org users | ✅ | ✅ | ❌ | ❌ |
| Delete own org users | ✅ | ✅ | ❌ | ❌ |
| Access Django Admin | ✅ | ✅ (if is_staff) | ❌ | ❌ |
| Create org data | ✅ | ✅ | Depends on model | ❌ |
| Edit org data | ✅ | ✅ | Depends on model | ❌ |
| Delete org data | ✅ | ✅ | Depends on model | ❌ |

---

## 🚀 Quick Setup Checklist

For each new model admin:

- [ ] Import `OrgAdminMixin`
- [ ] Add as first mixin in admin class
- [ ] Ensure model has `organization` field
- [ ] Test filtering works (org admin sees only their data)
- [ ] Test creation (auto-assigns organization)

For each new API viewset:

- [ ] Import appropriate permission class
- [ ] Add to `permission_classes`
- [ ] Ensure queryset uses `OrganizationManager`
- [ ] Test cross-org access is blocked
- [ ] Test org admin has full access to their org

---

## 🧪 Testing

### Test 1: Org Admin Can Manage Their Organization
```python
# Login as org admin
user = User.objects.get(email='admin@company-a.com')
assert user.is_org_admin == True
assert user.can_manage_organization() == True
assert user.can_manage_users() == True
```

### Test 2: Org Admin Cannot Access Other Organizations
```python
# Login as org admin from Company A
user_a = User.objects.get(email='admin@company-a.com')

# Try to access Company B's employee
employee_b = Employee.objects.get(organization__name='Company B')
assert not user_a.is_in_same_organization(employee_b)
# Should raise PermissionDenied or return 403
```

### Test 3: Regular User Cannot Manage Organization
```python
# Login as regular user
user = User.objects.get(email='employee@company-a.com')
assert user.is_org_admin == False
assert user.can_manage_organization() == False
assert user.can_manage_users() == False
```

---

## 📝 Migration Guide

### Before (No Org Admin Permissions)
```python
class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
```

### After (With Org Admin Permissions)
```python
from apps.core.org_permissions import IsOrgAdminOrSuperuser

class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOrgAdminOrSuperuser]
    # Now only org admins can create/edit/delete
```

---

## 🆘 Troubleshooting

### "Permission denied" for org admin
1. Check `is_org_admin = True`
2. Check `is_staff = True` (for Django admin)
3. Check `is_active = True`
4. Check user has `organization` assigned

### Org admin sees all organizations' data
1. Verify `OrgAdminMixin` is first in admin class inheritance
2. Check model has `organization` field
3. Verify queryset uses `OrganizationManager`

### Cannot create objects
1. Check permission class allows creation
2. Verify organization is auto-assigned
3. Check `has_add_permission()` returns True

---

**File Location**: `backend/apps/core/org_permissions.py`  
**Documentation**: This file  
**Status**: ✅ Production Ready
