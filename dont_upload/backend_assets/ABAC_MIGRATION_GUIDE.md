# ABAC Migration Guide

## Overview
The system has been migrated from **Role-Based Access Control (RBAC)** to **Attribute-Based Access Control (ABAC)**.

ABAC provides more flexible and granular access control based on:
- **Subject Attributes**: User properties (department, location, job level, etc.)
- **Resource Attributes**: Properties of the accessed resource
- **Action**: The operation being performed (view, create, update, delete)
- **Environment Attributes**: Context (time, date, IP address, etc.)

---

## Key Changes

### 1. App Renamed
- `apps.rbac` → `apps.abac`
- URL endpoint: `/api/v1/rbac/` → `/api/v1/abac/`

### 2. New Models

#### AttributeType
Defines types of attributes used in policies (subject, resource, action, environment).

```python
from apps.abac.models import AttributeType

# Example: Create a department attribute
AttributeType.objects.create(
    name="User Department",
    code="user_department",
    category=AttributeType.SUBJECT,
    data_type=AttributeType.STRING
)
```

#### Policy
Defines access control policies with rules.

```python
from apps.abac.models import Policy

# Example: Create a policy
policy = Policy.objects.create(
    name="HR Department - Employee Access",
    code="hr_employee_access",
    policy_type=Policy.MODULE,
    effect=Policy.ALLOW,
    resource_type="employee",
    actions=["view", "create", "update"],
    priority=10
)
```

#### PolicyRule
Individual conditions within a policy.

```python
from apps.abac.models import PolicyRule

# Example: Add rule - user.department == "HR"
PolicyRule.objects.create(
    policy=policy,
    attribute_type=dept_attr,
    attribute_path="department",
    operator=PolicyRule.EQUALS,
    value="HR"
)
```

#### UserPolicy
Assigns policies to specific users.

#### GroupPolicy
Assigns policies to groups (department, location, etc.).

#### PolicyLog
Audit log of policy evaluations.

---

## 3. New Permission System

### Using ABAC Permissions in Views

```python
from rest_framework import viewsets
from apps.abac.permissions import ABACPermission

class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [ABACPermission]
    abac_resource_type = 'employee'  # Optional: specify resource type
    
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
```

### Available Permission Classes

1. **ABACPermission** - Standard ABAC check
2. **DepartmentABACPermission** - Requires same department
3. **ManagerABACPermission** - Requires manager status
4. **OwnerOrABACPermission** - Owner or ABAC check

### Method Decorator

```python
from apps.abac.permissions import abac_permission_required

@abac_permission_required('employee', 'update')
def update_employee(request, employee_id):
    # Your code here
    pass
```

---

## 4. PolicyEngine Usage

```python
from apps.abac.engine import PolicyEngine

# Check access
engine = PolicyEngine(request.user)
has_access = engine.check_access(
    resource_type='employee',
    action='view',
    resource_attrs={'department': 'HR', 'confidential': False}
)

if has_access:
    # Grant access
    pass
```

---

## 5. Helper Functions for Common Policies

```python
from apps.abac.engine import PolicyHelper

# Create department-based policy
policy = PolicyHelper.create_department_access_policy(
    department_name='HR',
    actions=['view', 'create', 'update'],
    resource_type='employee'
)

# Create manager policy
policy = PolicyHelper.create_manager_access_policy(
    actions=['view', 'update', 'approve'],
    resource_type='leave'
)

# Create time-restricted policy
policy = PolicyHelper.create_time_restricted_policy(
    start_hour=9,
    end_hour=17,
    actions=['view', 'create'],
    resource_type='payroll'
)
```

---

## Migration Steps

### 1. Create Migrations
```bash
python manage.py makemigrations abac
python manage.py migrate abac
```

### 2. Create Base Attributes
```python
python manage.py shell

from apps.abac.models import AttributeType

# Subject attributes
AttributeType.objects.create(
    name="User Department", code="user_department",
    category=AttributeType.SUBJECT, data_type=AttributeType.STRING
)

AttributeType.objects.create(
    name="Is Manager", code="is_manager",
    category=AttributeType.SUBJECT, data_type=AttributeType.BOOLEAN
)

# Environment attributes
AttributeType.objects.create(
    name="Current Hour", code="current_hour",
    category=AttributeType.ENVIRONMENT, data_type=AttributeType.NUMBER
)
```

### 3. Create Base Policies

Example: HR admin access
```python
from apps.abac.models import Policy, PolicyRule, AttributeType

# Create policy
hr_admin_policy = Policy.objects.create(
    name="HR Admin Full Access",
    code="hr_admin_full",
    policy_type=Policy.GENERAL,
    effect=Policy.ALLOW,
    actions=['view', 'create', 'update', 'delete', 'approve'],
    priority=100
)

# Add rule: department == "HR"
dept_attr = AttributeType.objects.get(code="user_department")
PolicyRule.objects.create(
    policy=hr_admin_policy,
    attribute_type=dept_attr,
    attribute_path="department",
    operator=PolicyRule.EQUALS,
    value="HR"
)
```

### 4. Assign Policies to Users

```python
from apps.abac.models import UserPolicy
from apps.authentication.models import User

user = User.objects.get(email="admin@example.com")
UserPolicy.objects.create(
    user=user,
    policy=hr_admin_policy,
    is_active=True
)
```

### 5. Or Assign to Groups

```python
from apps.abac.models import GroupPolicy

group = GroupPolicy.objects.create(
    name="HR Department Group",
    group_type="department",
    group_value="HR",
    is_active=True
)
group.policies.add(hr_admin_policy)
```

---

## Policy Examples

### Example 1: Department-Based Access
```python
# Users in Finance department can view/create/update payroll
policy = Policy.objects.create(
    name="Finance Payroll Access",
    code="finance_payroll",
    resource_type="payroll",
    actions=["view", "create", "update"],
    effect=Policy.ALLOW
)

dept_attr = AttributeType.objects.get(code="user_department")
PolicyRule.objects.create(
    policy=policy,
    attribute_type=dept_attr,
    attribute_path="department",
    operator=PolicyRule.EQUALS,
    value="Finance"
)
```

### Example 2: Manager Can Approve Team Leave
```python
# Managers can approve leave for their team
policy = Policy.objects.create(
    name="Manager Approve Leave",
    code="manager_approve_leave",
    resource_type="leave",
    actions=["approve"],
    effect=Policy.ALLOW,
    combine_logic=Policy.COMBINE_AND
)

# Rule 1: User is a manager
manager_attr = AttributeType.objects.get(code="is_manager")
PolicyRule.objects.create(
    policy=policy,
    attribute_type=manager_attr,
    attribute_path="is_manager",
    operator=PolicyRule.EQUALS,
    value=True
)

# Rule 2: Resource owner's manager is the user
# (This would require custom attribute evaluation)
```

### Example 3: Time-Based Access
```python
# Payroll can only be accessed during business hours (9 AM - 5 PM)
policy = Policy.objects.create(
    name="Payroll Business Hours Only",
    code="payroll_business_hours",
    resource_type="payroll",
    actions=["view", "update"],
    effect=Policy.ALLOW,
    combine_logic=Policy.COMBINE_AND
)

hour_attr = AttributeType.objects.get(code="current_hour")

# Hour >= 9
PolicyRule.objects.create(
    policy=policy,
    attribute_type=hour_attr,
    attribute_path="hour",
    operator=PolicyRule.GREATER_THAN_EQUAL,
    value=9
)

# Hour < 17
PolicyRule.objects.create(
    policy=policy,
    attribute_type=hour_attr,
    attribute_path="hour",
    operator=PolicyRule.LESS_THAN,
    value=17
)
```

### Example 4: DENY Policy (Overrides ALLOW)
```python
# Deny access to confidential employees for non-HR users
deny_policy = Policy.objects.create(
    name="Deny Confidential Employee Access",
    code="deny_confidential_employee",
    resource_type="employee",
    actions=["view"],
    effect=Policy.DENY,  # DENY takes precedence
    priority=200,  # High priority
    combine_logic=Policy.COMBINE_AND
)

# Rule 1: Resource is confidential
confidential_attr = AttributeType.objects.create(
    name="Resource Confidential",
    code="resource_confidential",
    category=AttributeType.RESOURCE,
    data_type=AttributeType.BOOLEAN
)

PolicyRule.objects.create(
    policy=deny_policy,
    attribute_type=confidential_attr,
    attribute_path="confidential",
    operator=PolicyRule.EQUALS,
    value=True
)

# Rule 2: User is NOT in HR
dept_attr = AttributeType.objects.get(code="user_department")
PolicyRule.objects.create(
    policy=deny_policy,
    attribute_type=dept_attr,
    attribute_path="department",
    operator=PolicyRule.NOT_EQUALS,
    value="HR"
)
```

---

## Benefits of ABAC

1. **Fine-Grained Control**: Access based on multiple attributes, not just roles
2. **Dynamic Policies**: Policies adapt to changing attributes (e.g., user gets promoted)
3. **Context-Aware**: Time, location, and other environmental factors
4. **Scalable**: Add new attributes without changing code
5. **Audit Trail**: Complete log of policy evaluations

---

## Backward Compatibility

Legacy RBAC permission classes (IsHRAdmin, IsManager, etc.) have been updated to use ABAC internally, so existing code should continue to work, but we recommend migrating to the new ABAC system for better flexibility.

---

## Testing Policies

```python
from apps.abac.engine import PolicyEngine
from apps.authentication.models import User

user = User.objects.get(email="test@example.com")
engine = PolicyEngine(user, log_decisions=False)

# Test access
can_view = engine.check_access('employee', 'view')
can_create = engine.check_access('employee', 'create')
can_update = engine.check_access('employee', 'update', 
                                 resource_attrs={'confidential': True})

print(f"Can view: {can_view}")
print(f"Can create: {can_create}")
print(f"Can update confidential: {can_update}")
```

---

## Admin Interface

Access ABAC management at: `/admin/abac/`

- **Attribute Types**: Define new attributes
- **Policies**: Create and manage policies
- **Policy Rules**: Configure policy conditions
- **User Policies**: Assign policies to users
- **Group Policies**: Assign policies to groups
- **Policy Logs**: View access decision audit logs

---

## Next Steps

1. Run migrations
2. Create base attribute types
3. Create policies for your use cases
4. Assign policies to users/groups
5. Update views to use ABAC permissions
6. Test thoroughly
7. Monitor policy logs

---

## Support

For questions or issues, refer to:
- Models: `apps/abac/models.py`
- Policy Engine: `apps/abac/engine.py`
- Permissions: `apps/abac/permissions.py`
