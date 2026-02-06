# 👥 How to Assign Users to Organizations

**Date**: January 28, 2026  
**Status**: ✅ Complete guide

---

## 🎯 Overview

Since `organization` is now a **non-editable field**, organization assignment is **automatic and enforced**:

- ✅ **Org admins**: Users automatically belong to their organization
- ✅ **Superusers**: Can create users for any organization  
- ✅ **API**: Same auto-assignment via serializer
- 🔒 **Security**: No manual organization field to accidentally misuse

---

## 📋 Method 1: Django Admin (GUI)

### For Org Admins

**Flow**:
1. Login to `/admin` as org admin
2. Go to **Authentication** → **Users** → **Add User**
3. Fill in fields:
   - Email: `newuser@company.com`
   - Username: `newuser`
   - First Name / Last Name
   - Password
   - is_staff: ✅ (to give them access to specific features)
   - is_org_admin: ☐ (leave unchecked - only for true admins)
   - is_verified: ✅ (optional)

4. Click **Save** → **Organization automatically assigned** ✅

**Result**: New user belongs to your organization

```python
# Behind the scenes:
# OrgAdminMixin.save_model() automatically does:
validated_data['organization'] = request.user.organization  # Your org
```

---

### For Superusers

**Flow**:
1. Login to `/admin` as superuser
2. Go to **Authentication** → **Users** → **Add User**
3. Same fields as above (organization field is hidden but still assigned)
4. Click **Save**

**Organization Assignment**:
- If user has no organization → defaults to superuser's organization
- To assign different organization → Use **API** method below

---

## 🔌 Method 2: REST API

### Endpoint: Create User

**URL**: `POST /api/users/` (need to implement routing)

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (Org Admin):
```json
{
  "email": "newuser@company.com",
  "username": "newuser",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!",
  "is_verified": true,
  "is_active": true
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@company.com",
  "username": "newuser",
  "first_name": "John",
  "last_name": "Doe",
  "organization": "550e8400-e29b-41d4-a716-446655440000",  ← Auto-assigned
  "is_org_admin": false,
  "is_staff": false,
  "is_active": true,
  "is_verified": true
}
```

**Organization Assignment**:
```python
# Serializer automatically does:
validated_data['organization'] = request.user.organization  # Your org
validated_data['is_org_admin'] = False  # Always false for new users
validated_data['is_staff'] = False      # Always false for new users
```

---

## 🛠️ How to Set Up API Routing

Add this to `backend/apps/authentication/urls.py`:

```python
from rest_framework.routers import DefaultRouter
from .views import UserManagementViewSet

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='user-management')

urlpatterns = [
    # ... existing paths ...
    path('', include(router.urls)),  # /api/users/ endpoint
]
```

---

## 📝 Step-by-Step Examples

### Example 1: Org Admin Creates User (Admin Panel)

```
1. Org admin from "Company A" logs in
2. Goes to /admin/authentication/user/add/
3. Fills in:
   - Email: john@company-a.com
   - Username: john.doe
   - First Name: John
   - Last Name: Doe
   - Password: (set password)
   - is_org_admin: ☐ (unchecked)
   - is_staff: ✅ (checked, if they need admin access)
4. Clicks Save
5. ✅ John automatically belongs to "Company A"
6. John can now log in with these credentials
```

### Example 2: Org Admin Creates User (API)

```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@company-a.com",
    "username": "jane.smith",
    "first_name": "Jane",
    "last_name": "Smith",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "is_staff": true
  }'
```

**Response**:
```json
{
  "id": "...",
  "email": "jane@company-a.com",
  "organization": "company-a-uuid",  ← Auto-assigned
  "is_org_admin": false,
  "is_staff": true
}
```

### Example 3: Superuser Creates User for Different Org

**Admin Panel**:
1. Superuser logs in
2. Goes to Users → Add User
3. Same form, but organization field is hidden
4. User auto-assigned to superuser's org (if needed, use SQL to update)

**Better: Use Django Management Command**:

```bash
python manage.py shell
```

```python
from apps.authentication.models import User
from apps.core.models import Organization

# Get organization
company_b = Organization.objects.get(name="Company B")

# Create user
user = User.objects.create_user(
    email="bob@company-b.com",
    username="bob.johnson",
    password="SecurePass123!",
    organization=company_b,  # ← Explicitly set for different org
    is_staff=False,
    is_org_admin=False,
    is_verified=True
)

print(f"✅ Created {user.email} in {user.organization.name}")
```

---

## 🔐 Security Guarantees

| Scenario | Result | Security |
|----------|--------|----------|
| Org admin creates user | Auto → their org | ✅ Cannot assign to other orgs |
| Org admin tries to change org | Hidden field | ✅ Field not visible |
| Superuser creates user | Auto → their org (or explicit) | ✅ Can be controlled |
| API bypass attempt | Rejected by serializer | ✅ Serializer forces correct org |
| Admin form bypass | Model field is non-editable | ✅ Database constraint |

---

## 🆘 Troubleshooting

### "Organization field not appearing in admin"

**Expected behavior** ✅

The organization field is intentionally hidden for org admins (for security). 

**Solution**: It's automatically assigned - no need to set it manually.

---

### "I'm a superuser and want to assign a user to Company B"

**Option 1: Django Shell**
```python
python manage.py shell
from apps.authentication.models import User
from apps.core.models import Organization

company_b = Organization.objects.get(name="Company B")
user = User.objects.get(email="newuser@company.com")
user.organization = company_b
user.save()
```

**Option 2: Direct Database**
```sql
UPDATE authentication_user 
SET organization_id = (SELECT id FROM core_organization WHERE name = 'Company B')
WHERE email = 'newuser@company.com';
```

**Option 3: Create with Shell Directly**
```python
from apps.authentication.models import User
from apps.core.models import Organization

company_b = Organization.objects.get(name="Company B")
user = User.objects.create_user(
    email="newuser@company-b.com",
    username="newuser",
    password="Pass123!",
    organization=company_b
)
```

---

### "New user still has no organization"

**Check 1**: Is OrgAdminMixin applied to UserAdmin?
```python
@admin.register(User)
class UserAdmin(OrgAdminMixin, SafeDeleteMixin, BaseUserAdmin):  # ← OrgAdminMixin first
```

**Check 2**: Did the user creating the account have an organization?
```python
request.user.organization  # Must not be None
```

**Check 3**: Is organization field editable=False in model?
```python
organization = models.ForeignKey(..., editable=False)  # ← Correct
```

**Fix**: Manually assign using shell (see above)

---

## 📊 Quick Reference

| Who | Method | Organization | Notes |
|-----|--------|--------------|-------|
| Org Admin | Admin Panel | Auto (their org) | Field hidden, auto-assigned |
| Org Admin | API | Auto (their org) | Serializer forces it |
| Superuser | Admin Panel | Auto (their org) | Field hidden, use shell for different |
| Superuser | Management Command | Manual | Full control |
| Superuser | Django Shell | Manual | Full control |
| Superuser | Direct SQL | Manual | Direct database update |

---

## ✅ Best Practices

1. **Org admins**: Always use admin panel - organization is automatic
2. **Superusers**: If assigning to different org, use Django shell
3. **API**: Always use `/api/users/` endpoint for programmatic creation
4. **Never**: Manually edit organization field via SQL (use shell instead)
5. **Verify**: After creation, check `user.organization` is correct

```python
# Verify script
user = User.objects.get(email="newuser@company.com")
print(f"Email: {user.email}")
print(f"Organization: {user.organization.name}")
print(f"is_org_admin: {user.is_org_admin}")
print(f"is_staff: {user.is_staff}")
```

---

## 🎓 Key Concepts

**editable=False**:
- Field cannot be edited in Django admin forms
- Field cannot be edited via DRF serializers
- Field CAN be set programmatically (shell, API logic)
- OrgAdminMixin.save_model() handles automatic assignment

**OrgAdminMixin.save_model()**:
- Runs when new object is created (change=False)
- Auto-assigns organization to requesting user's org
- For org admins: always their organization
- For superusers: their organization (can override with shell)

**UserOrgAdminCreateSerializer**:
- Removes organization field from API form
- Validates only org admins can create users
- Forces organization = request.user.organization
- Forces is_org_admin = False, is_staff = False

---

## 🔄 Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Org Admin tries to create new user                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Goes to /admin/authentication/user/add/                  │
│ 2. Sees form WITHOUT organization field (hidden)             │
│ 3. Fills in: email, username, password, etc.               │
│ 4. Clicks Save                                               │
│    ↓                                                          │
│ 5. UserAdmin.has_add_permission() → True ✅                 │
│    ↓                                                          │
│ 6. UserAdmin.save_model() called                            │
│    ├─ OrgAdminMixin.save_model() runs FIRST                 │
│    │  ├─ Detects: obj.organization_id is None              │
│    │  └─ Sets: obj.organization = request.user.organization │
│    ├─ Then: super().save_model()                            │
│    └─ User saved with correct organization ✅              │
│ 7. ✅ User now belongs to org admin's organization          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Files

- [SECURITY_HARDENING_FINAL.md](SECURITY_HARDENING_FINAL.md) - Full security details
- [ORG_ADMIN_PERMISSIONS.md](ORG_ADMIN_PERMISSIONS.md) - Permission reference
- `backend/apps/core/org_permissions.py` - OrgAdminMixin implementation
- `backend/apps/authentication/admin.py` - UserAdmin configuration
- `backend/apps/authentication/serializers.py` - UserOrgAdminCreateSerializer

---

**Status**: ✅ Complete  
**Last Updated**: January 28, 2026
