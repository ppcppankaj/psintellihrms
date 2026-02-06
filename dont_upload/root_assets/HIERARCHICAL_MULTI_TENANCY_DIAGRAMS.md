# Hierarchical Multi-Tenancy Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIERARCHICAL MULTI-TENANCY                    │
│                   Organization → User → Branch                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Organization       │  Pure Entity (no credentials)
│   ----------------   │  - id (UUID)
│   • name            │  - name, email, phone
│   • email           │  - timezone, currency
│   • subscription    │  - subscription_status
│   • is_active       │  - is_active
└──────────────────────┘
         │
         │ Referenced by
         ↓
┌──────────────────────┐
│  OrganizationUser    │  User ↔ Organization Mapping
│  ----------------    │  
│   • user (FK)       │  Enforces: One Organization Per User
│   • organization    │  
│   • role            │  Roles:
│     - ORG_ADMIN     │   • ORG_ADMIN: Manage organization
│     - EMPLOYEE      │   • EMPLOYEE: Regular user
│   • is_active       │  
└──────────────────────┘
         │
         │ FK to
         ↓
┌──────────────────────┐
│       User           │  Global Identity (no direct org FK)
│   ----------------   │  
│   • id (UUID)       │  - email, username
│   • email           │  - first_name, last_name
│   • password        │  - employee_id
│   • is_staff        │  - is_active, is_verified
│   • is_superuser    │  - Security fields (2FA, etc)
└──────────────────────┘
         │
         │ Referenced by
         ↓
┌──────────────────────┐
│    BranchUser        │  User ↔ Branch Mapping
│  ----------------    │  
│   • user (FK)       │  Multiple Branches Per User
│   • branch (FK)     │  
│   • role            │  Roles:
│     - BRANCH_ADMIN  │   • BRANCH_ADMIN: Manage branch
│     - EMPLOYEE      │   • EMPLOYEE: Regular user
│   • is_active       │  
└──────────────────────┘
         │
         │ FK to
         ↓
┌──────────────────────┐
│       Branch         │  Physical Location/Division
│   ----------------   │  
│   • organization    │  - name, code
│   • name            │  - address (line1, city, state, country)
│   • address         │  - contact (phone, email)
│   • is_active       │  - is_active
└──────────────────────┘
         │
         │ Belongs to
         └──────────────────┐
                            │
                            ↓
                     ┌──────────────┐
                     │ Organization │
                     └──────────────┘
```

## Data Relationships

```
Organization (1) ←──── (1) OrganizationUser (N) ────→ (1) User
     │                                                   │
     │                                                   │
     └──────→ (1..N) Branch (1) ←──── (N) BranchUser ←──┘
                                           
Constraints:
• One user can belong to ONE organization only
• One user can belong to MULTIPLE branches
• All branches of a user must belong to user's organization
```

## Permission Hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│                         SUPERUSER                               │
│  • Access ALL organizations                                     │
│  • Assign users to any organization                             │
│  • Full Django admin access                                     │
└────────────────────────────────────────────────────────────────┘
                                │
                                ↓
        ┌───────────────────────────────────────┐
        │        ORGANIZATION ADMIN              │
        │  • Access ONE organization             │
        │  • Create/manage users in org          │
        │  • Create/manage branches              │
        │  • Assign users to branches            │
        │  • View/edit org data only             │
        └───────────────────────────────────────┘
                                │
                                ↓
                ┌──────────────────────────────┐
                │      BRANCH ADMIN            │
                │  • Manage assigned branch    │
                │  • View branch users         │
                │  • Limited permissions       │
                └──────────────────────────────┘
                                │
                                ↓
                        ┌──────────────┐
                        │   EMPLOYEE   │
                        │  • Basic     │
                        │    access    │
                        └──────────────┘
```

## Django Admin Workflow

### Creating a User (Superuser)

```
1. Navigate to Users → Add User
   ┌─────────────────────────────────┐
   │ Add User                        │
   ├─────────────────────────────────┤
   │ Email: john@example.com         │
   │ Username: john                  │
   │ Password: ********              │
   │ First Name: John                │
   │ Last Name: Doe                  │
   └─────────────────────────────────┘
                  │
                  ↓
2. Save → Opens Edit Page with Inlines
   ┌─────────────────────────────────┐
   │ Edit User: john@example.com     │
   ├─────────────────────────────────┤
   │ Basic Info                      │
   │ ...                             │
   ├─────────────────────────────────┤
   │ Organization Assignment         │ ← OrganizationUserInline
   │ ┌───────────────────────────┐   │
   │ │ Organization: [Acme Corp] │   │
   │ │ Role: [ORG_ADMIN]         │   │
   │ │ Is Active: ✓              │   │
   │ └───────────────────────────┘   │
   ├─────────────────────────────────┤
   │ Branch Assignments              │ ← BranchUserInline
   │ ┌───────────────────────────┐   │
   │ │ Branch: [Main Office]     │   │
   │ │ Role: [BRANCH_ADMIN]      │   │
   │ │ Is Active: ✓              │   │
   │ ├───────────────────────────┤   │
   │ │ Branch: [Warehouse]       │   │
   │ │ Role: [EMPLOYEE]          │   │
   │ │ Is Active: ✓              │   │
   │ └───────────────────────────┘   │
   └─────────────────────────────────┘
```

### Creating a Branch

```
1. Navigate to Branches → Add Branch
   ┌─────────────────────────────────┐
   │ Add Branch                      │
   ├─────────────────────────────────┤
   │ Organization: [Acme Corp]       │ ← Filtered for Org Admin
   │ Name: Main Office               │
   │ Code: MAIN01                    │
   │ Address: 123 Main St            │
   │ City: New York                  │
   │ State: NY                       │
   │ Country: USA                    │
   │ Phone: +1-555-1234              │
   │ Is Active: ✓                    │
   └─────────────────────────────────┘
```

## API Usage Examples

### Get User's Organization

```python
# Using helper method
user_org = request.user.get_organization()
if user_org:
    print(f"Organization: {user_org.name}")
else:
    print("User has no organization")
```

### Check User Role

```python
# Check if org admin
if request.user.is_organization_admin():
    print("User is organization admin")

# Get role details
membership = request.user.get_organization_membership()
if membership:
    print(f"Role: {membership.get_role_display()}")
```

### Get User's Branches

```python
# Get all branches
branches = request.user.get_branches()
for branch in branches:
    print(f"Branch: {branch.name}")

# Get admin branches only
admin_branches = request.user.get_admin_branches()
for branch in admin_branches:
    print(f"Admin of: {branch.name}")

# Check specific branch
branch = Branch.objects.get(name='Main Office')
if request.user.is_branch_admin_for(branch):
    print("User can manage Main Office")
```

### Filter Queryset by Organization

```python
# In ViewSet or Admin
def get_queryset(self, request):
    qs = super().get_queryset(request)
    
    if request.user.is_superuser:
        return qs
    
    # Filter by user's organization
    user_org = request.user.get_organization()
    if user_org:
        return qs.filter(organization=user_org)
    
    return qs.none()
```

## Migration Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    BEFORE MIGRATION                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  User                                                         │
│  ├── organization (FK to Organization) ← Direct FK           │
│  └── is_org_admin (BooleanField)       ← Direct flag         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ python manage.py migrate_organization_to_mapping
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                     AFTER MIGRATION                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  User                                                         │
│  └── organization (FK)     ← KEPT for backward compatibility │
│                                                               │
│  OrganizationUser (NEW!)                                      │
│  ├── user              → User.id                              │
│  ├── organization      → migrated from User.organization     │
│  └── role              → migrated from User.is_org_admin     │
│       • ORG_ADMIN if is_org_admin=True                        │
│       • EMPLOYEE if is_org_admin=False                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Query Patterns

### Before (Direct FK)
```python
# Getting organization
org = user.organization

# Checking admin status
if user.is_org_admin:
    do_admin_stuff()

# Filtering
Employee.objects.filter(user__organization=user.organization)
```

### After (Mapping Model)
```python
# Getting organization
org = user.get_organization()

# Checking admin status
if user.is_organization_admin():
    do_admin_stuff()

# Filtering
org = user.get_organization()
if org:
    Employee.objects.filter(user__organization_memberships__organization=org)
```

## Database Schema

```sql
-- organization_users table
CREATE TABLE organization_users (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ORG_ADMIN', 'EMPLOYEE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (user_id, organization_id)
);

CREATE INDEX idx_org_users_user_active 
    ON organization_users(user_id, is_active);
CREATE INDEX idx_org_users_org_role_active 
    ON organization_users(organization_id, role, is_active);

-- branches table
CREATE TABLE branches (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(254),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (organization_id, name)
);

CREATE INDEX idx_branches_org_active 
    ON branches(organization_id, is_active);

-- branch_users table
CREATE TABLE branch_users (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('BRANCH_ADMIN', 'EMPLOYEE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (user_id, branch_id)
);

CREATE INDEX idx_branch_users_user_active 
    ON branch_users(user_id, is_active);
CREATE INDEX idx_branch_users_branch_role_active 
    ON branch_users(branch_id, role, is_active);
```

## Validation Rules

```
┌────────────────────────────────────────────────────────┐
│  OrganizationUser Validation                           │
├────────────────────────────────────────────────────────┤
│  ✓ User can belong to ONLY ONE organization            │
│  ✓ Enforced in clean() method                          │
│  ✓ Unique constraint on (user, organization)           │
│  ✓ is_active check before creating new assignment      │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  BranchUser Validation                                 │
├────────────────────────────────────────────────────────┤
│  ✓ User can belong to MULTIPLE branches                │
│  ✓ Branch must belong to user's organization           │
│  ✓ Enforced in clean() method                          │
│  ✓ Unique constraint on (user, branch)                 │
│  ✓ Validates org membership before assignment          │
└────────────────────────────────────────────────────────┘
```

## Error Handling

```
Attempting to assign user to second organization:
┌─────────────────────────────────────────────────┐
│ ValidationError                                 │
├─────────────────────────────────────────────────┤
│ "User john@example.com is already assigned to  │
│  an organization. A user can only belong to one │
│  organization."                                 │
└─────────────────────────────────────────────────┘

Attempting to assign user to branch in different org:
┌─────────────────────────────────────────────────┐
│ ValidationError                                 │
├─────────────────────────────────────────────────┤
│ "User john@example.com belongs to organization  │
│  Acme Corp, but branch Main Office belongs to   │
│  TechCo. Cannot assign user to branch in        │
│  different organization."                       │
└─────────────────────────────────────────────────┘
```

---

**Visual Summary**: This architecture provides true hierarchical multi-tenancy with clear separation of concerns, enforced data integrity, and flexible role management at both organization and branch levels.
