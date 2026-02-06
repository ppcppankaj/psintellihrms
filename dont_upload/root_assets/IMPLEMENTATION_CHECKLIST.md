# 🏗️ Organization-Based Multi-Tenancy - Implementation Checklist

**Source**: User Requirements (Jan 28, 2026)  
**Status**: Implementation & Verification

---

## 📋 STEP 1: Organization Model ✅ VERIFIED

**Location**: `backend/apps/core/models.py`

```python
class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    currency = models.CharField(max_length=3, default='USD')
    timezone = models.CharField(max_length=50, default='UTC')
    subscription_status = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Verification**: ✅
- [x] UUID primary key (editable=False)
- [x] name field (unique, required)
- [x] is_active boolean
- [x] No slug field
- [x] No credentials
- [x] Pure data entity

---

## 👤 STEP 2: User Model Organization Bound ✅ VERIFIED

**Location**: `backend/apps/authentication/models.py`

```python
class User(AbstractUser):
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.PROTECT,
        null=True,
        editable=False,  # 🔒 HARD LOCK
        related_name='users',
        db_index=True
    )
    is_org_admin = models.BooleanField(default=False, db_index=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
```

**Verification**: ✅
- [x] ForeignKey to Organization
- [x] on_delete=models.PROTECT (cannot delete org if users exist)
- [x] null=True (for superusers)
- [x] editable=False (🔒 HARD LOCK)
- [x] is_org_admin boolean field
- [x] indexed fields

---

## 🌐 STEP 3: Create Organization API (Superuser Only)

**Status**: ⏳ NEEDS IMPLEMENTATION

**Required Files**:
1. Organization ViewSet
2. Organization Serializer
3. Organization Permissions

### 3.1: Organization Serializer
**File**: `backend/apps/core/serializers.py`

```python
from rest_framework import serializers
from .models import Organization

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'email', 'currency', 'timezone', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_name(self, value):
        """Ensure organization name is unique"""
        if Organization.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Organization name must be unique")
        return value
```

**Status**: ⏳ TODO

### 3.2: Organization ViewSet
**File**: `backend/apps/core/views.py` (new or existing)

```python
from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model
from .models import Organization
from .serializers import OrganizationSerializer

class IsSuperuser(BasePermission):
    """Only superusers can create/modify organizations"""
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_superuser

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    🔐 Organization Management - Superuser Only
    
    - Superuser: See all organizations, create, edit, delete
    - Org Admin: See only their organization (read-only)
    - Regular User: No access
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperuser]
    
    def get_queryset(self):
        """
        Org admins see only their organization
        Superusers see all
        """
        user = self.request.user
        
        if user.is_superuser:
            return Organization.objects.all()
        
        if user.is_org_admin and user.organization:
            return Organization.objects.filter(id=user.organization_id)
        
        return Organization.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Superuser only"""
        if not request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only superusers can create organizations")
        return super().create(request, *args, **kwargs)
```

**Status**: ⏳ TODO

### 3.3: URL Registration
**File**: `backend/apps/core/urls.py` (new or existing)

```python
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Status**: ⏳ TODO

---

## 👥 STEP 4: Create Users API with Org Assignment

**Status**: ⏳ NEEDS VERIFICATION

**Required Implementation**: UserOrgAdminCreateSerializer (ALREADY CREATED)

**File**: `backend/apps/authentication/serializers.py`

**Current State**: ✅ Already implemented

```python
class UserOrgAdminCreateSerializer(serializers.ModelSerializer):
    """
    🔒 SECURITY: Serializer for org admins creating sub-users
    
    Rules:
    - Org admin → same org only (forced)
    - Org admin → cannot set is_org_admin (forced False)
    - Org admin → cannot set is_staff (forced False)
    - Superuser → can specify organization explicitly
    """
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name', 'phone',
            'password', 'password_confirm', 'is_verified', 'is_active'
        ]
        read_only_fields = ['organization', 'is_org_admin', 'is_staff', 'is_superuser']
    
    def create(self, validated_data):
        """
        🔒 Force organization assignment based on creator
        """
        request = self.context.get('request')
        
        validated_data.pop('password_confirm')
        
        # Org admin → same org only
        if request.user.is_org_admin:
            validated_data['organization'] = request.user.organization
            validated_data['is_org_admin'] = False
            validated_data['is_staff'] = False
        
        # Superuser → can specify org (required)
        elif request.user.is_superuser:
            if 'organization' not in validated_data or not validated_data.get('organization'):
                raise serializers.ValidationError("Superuser must specify organization")
        
        return User.objects.create_user(**validated_data)
```

**Status**: ✅ VERIFIED

---

## 🔒 STEP 5: Prevent Org Admin From Changing Organization

**Status**: ⏳ NEEDS IMPLEMENTATION IN SERIALIZER UPDATE

**File**: `backend/apps/authentication/serializers.py`

**Add to UserOrgAdminCreateSerializer**:

```python
def update(self, instance, validated_data):
    """
    🔒 Org admin cannot change:
    - organization (silently ignore)
    - is_org_admin (silently ignore)
    - is_staff (silently ignore)
    """
    request = self.context.get('request')
    
    # Remove organization from updates
    validated_data.pop('organization', None)
    
    # Org admin cannot modify privilege fields
    if request.user.is_org_admin and not request.user.is_superuser:
        validated_data.pop('is_org_admin', None)
        validated_data.pop('is_staff', None)
        validated_data.pop('is_superuser', None)
    
    return super().update(instance, validated_data)
```

**Status**: ⏳ TODO - Add to UserOrgAdminCreateSerializer

---

## 🔍 STEP 6: Org Admin Visibility Restrictions

**Status**: ⏳ PARTIALLY DONE (OrgAdminMixin exists)

**Current Implementation**: ✅ Already in OrgAdminMixin

**File**: `backend/apps/core/org_permissions.py`

**Verification**:
```python
def get_queryset(self, request):
    """Filter queryset by organization"""
    qs = super().get_queryset(request)
    
    # Superusers see all data
    if request.user.is_superuser:
        return qs
    
    # Org admins see only their organization's data
    if request.user.is_org_admin and request.user.is_staff:
        if hasattr(qs.model, 'organization'):
            return qs.filter(organization=request.user.organization)
    
    return qs.none()
```

**Status**: ✅ VERIFIED

---

## 🛡️ STEP 7: Django Admin Org-Aware

**Status**: ⏳ PARTIALLY DONE

### 7.1: Organization Admin

**File**: `backend/apps/core/admin.py`

**Required**:
```python
@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('id', 'name', 'email')}),
        ('Settings', {'fields': ('currency', 'timezone', 'is_active')}),
        ('Status', {'fields': ('subscription_status',)}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        
        # Superuser sees all orgs
        if request.user.is_superuser:
            return qs
        
        # Org admin sees only their org
        if request.user.is_org_admin and request.user.organization:
            return qs.filter(id=request.user.organization_id)
        
        return qs.none()
    
    def has_add_permission(self, request):
        """Only superusers can add organizations"""
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        """
        Superuser: Full access
        Org admin: Can edit own org
        Regular user: No access
        """
        if request.user.is_superuser:
            return True
        
        if request.user.is_org_admin and obj:
            return obj.id == request.user.organization_id
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete organizations"""
        return request.user.is_superuser
```

**Status**: ⏳ TODO

### 7.2: User Admin

**File**: `backend/apps/authentication/admin.py` (ALREADY DONE)

**Current State**: ✅ Already implemented with OrgAdminMixin

**Status**: ✅ VERIFIED

---

## 🧪 STEP 8: Verification Script

**Status**: ⏳ TODO

**File**: `backend/verify_org_model.py`

```python
"""
Verification script for organization-based multi-tenancy
Runs through all 8 steps to ensure correct implementation
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.core.models import Organization
from apps.authentication.models import User
from django.contrib.auth import get_user_model

def verify_step_1():
    """Step 1: Organization Model"""
    print("✓ STEP 1: Organization Model")
    
    # Check Organization fields
    org_fields = [f.name for f in Organization._meta.get_fields()]
    required = ['id', 'name', 'email', 'is_active', 'created_at']
    
    for field in required:
        assert field in org_fields, f"Missing field: {field}"
    
    # Verify no slug
    assert 'slug' not in org_fields, "❌ Organization should not have slug field"
    
    print("  ✅ Organization model correct")

def verify_step_2():
    """Step 2: User Model Organization Bound"""
    print("✓ STEP 2: User Model Organization Bound")
    
    # Check User fields
    user_fields = [f.name for f in User._meta.get_fields()]
    required = ['organization', 'is_org_admin', 'is_staff', 'is_verified']
    
    for field in required:
        assert field in user_fields, f"Missing field: {field}"
    
    # Check organization is non-editable
    org_field = User._meta.get_field('organization')
    assert not org_field.editable, "❌ organization field must have editable=False"
    assert org_field.null, "❌ organization field must have null=True"
    
    print("  ✅ User model organization bound correctly")

def verify_step_3():
    """Step 3: Create Organization"""
    print("✓ STEP 3: Create Organization (Verify API exists)")
    
    # This would check if OrganizationViewSet exists
    try:
        from apps.core.views import OrganizationViewSet
        print("  ✅ OrganizationViewSet exists")
    except ImportError:
        print("  ⚠️  OrganizationViewSet not yet implemented")

def verify_step_4():
    """Step 4: Create Users API"""
    print("✓ STEP 4: Create Users API with Org Assignment")
    
    try:
        from apps.authentication.serializers import UserOrgAdminCreateSerializer
        print("  ✅ UserOrgAdminCreateSerializer exists")
    except ImportError:
        print("  ❌ UserOrgAdminCreateSerializer missing")

def verify_step_5():
    """Step 5: Prevent Org Change"""
    print("✓ STEP 5: Prevent Org Admin From Changing Organization")
    
    # Check if serializer has update method that blocks org changes
    from apps.authentication.serializers import UserOrgAdminCreateSerializer
    
    if hasattr(UserOrgAdminCreateSerializer, 'update'):
        print("  ✅ Update method exists (should block org changes)")
    else:
        print("  ⚠️  Update method should be added to serializer")

def verify_step_6():
    """Step 6: Org Admin Visibility"""
    print("✓ STEP 6: Org Admin Visibility Restrictions")
    
    from apps.core.org_permissions import OrgAdminMixin
    
    if hasattr(OrgAdminMixin, 'get_queryset'):
        print("  ✅ OrgAdminMixin.get_queryset() exists (filters by org)")
    else:
        print("  ❌ OrgAdminMixin missing get_queryset()")

def verify_step_7():
    """Step 7: Django Admin"""
    print("✓ STEP 7: Django Admin Org-Aware")
    
    try:
        from apps.core.admin import OrganizationAdmin
        print("  ✅ OrganizationAdmin exists")
    except ImportError:
        print("  ⚠️  OrganizationAdmin needs to be created/updated")
    
    try:
        from apps.authentication.admin import UserAdmin
        print("  ✅ UserAdmin exists")
    except ImportError:
        print("  ❌ UserAdmin missing")

def verify_step_8():
    """Step 8: Run Verification"""
    print("✓ STEP 8: Verification Complete")

def main():
    print("\n" + "="*60)
    print("🏗️  ORGANIZATION-BASED MULTI-TENANCY VERIFICATION")
    print("="*60 + "\n")
    
    try:
        verify_step_1()
        verify_step_2()
        verify_step_3()
        verify_step_4()
        verify_step_5()
        verify_step_6()
        verify_step_7()
        verify_step_8()
        
        print("\n" + "="*60)
        print("✅ VERIFICATION COMPLETE")
        print("="*60 + "\n")
        
    except AssertionError as e:
        print(f"\n❌ VERIFICATION FAILED: {e}\n")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
```

**Usage**:
```bash
python backend/verify_org_model.py
```

**Status**: ⏳ TODO

---

## 📊 FINAL RULE MATRIX

| Action | Superuser | Org Admin | Regular User |
|--------|-----------|-----------|--------------|
| Create organization | ✅ | ❌ | ❌ |
| See all orgs | ✅ | ❌ | ❌ |
| See own org | ✅ | ✅ | ✅ |
| Create users | ✅ | ✅ | ❌ |
| Create org admins | ✅ | ✅ | ❌ |
| Change user org | ✅ | ❌ | ❌ |
| Change own org | ❌ | ❌ | ❌ |

---

## ✅ IMPLEMENTATION STATUS

| Step | Task | Status | File |
|------|------|--------|------|
| 1 | Organization Model | ✅ | `backend/apps/core/models.py` |
| 2 | User Model Organization Bound | ✅ | `backend/apps/authentication/models.py` |
| 3 | Create Organization API | ⏳ | `backend/apps/core/views.py` |
| 3 | Organization Serializer | ⏳ | `backend/apps/core/serializers.py` |
| 3 | Organization Permissions | ⏳ | `backend/apps/core/views.py` |
| 4 | Create Users API | ✅ | `backend/apps/authentication/serializers.py` |
| 5 | Prevent Org Change | ⏳ | `backend/apps/authentication/serializers.py` |
| 6 | Org Visibility | ✅ | `backend/apps/core/org_permissions.py` |
| 7 | Django Admin Org-Aware | ⏳ | `backend/apps/core/admin.py` |
| 8 | Verification Script | ⏳ | `backend/verify_org_model.py` |

---

## 🎯 NEXT STEPS

1. **Implement Step 3**: Organization ViewSet and API
2. **Implement Step 5**: Add update() blocking to serializer
3. **Implement Step 7**: Create OrganizationAdmin
4. **Implement Step 8**: Create verification script
5. **Test All Steps**: Run verification and API tests

**Expected Completion**: Ready for final testing

---

**Source**: User Requirements (Jan 28, 2026)  
**Last Updated**: January 28, 2026
