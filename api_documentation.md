# Backend API Documentation

This document provides a comprehensive list of the backend APIs, their workflows, and expected JSON structures.

**Base URL:** `http://localhost:8000/api/v1` (for local development)
**Authentication:** Most endpoints require `Authorization: Bearer <access_token>` header.

## 1. Authentication (`/api/v1/auth/`)

### **Login**
*   **Endpoint:** `POST /api/v1/auth/login/`
*   **Workflow:** User submits email and password. Backend validates credentials. If valid, returns Access and Refresh tokens. Includes `organization_id` in token for multi-tenancy.
*   **Input JSON:**
    ```json
    {
      "email": "user@example.com",
      "password": "secretpassword"
    }
    ```
*   **Output JSON:**
    ```json
    {
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

### **Current User Profile**
*   **Endpoint:** `GET /api/v1/auth/profile/`
*   **Workflow:** Fetches details of the currently logged-in user using the Token. Used to display user info, avatar, role-based UI elements.
*   **Output JSON:**
    ```json
    {
      "id": "uuid-string",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "avatar": "http://.../avatars/user.jpg",
      "is_superuser": false,
      "roles": ["org_admin", "manager"],
      "permissions": ["view_dashboard", "manage_users"],
      "organization": {
        "id": "org-uuid",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "subscription_status": "active"
      }
    }
    ```

### **My Branches**
*   **Endpoint:** `GET /api/v1/auth/branches/my-branches/`
*   **Workflow:** Returns a list of branches the user has access to, and the current active branch context.
*   **Output JSON:**
    ```json
    {
      "branches": [
        {
          "id": "branch-uuid-1",
          "name": "Headquarters",
          "code": "HQ",
          "type": "headquarters",
          "location": "New York"
        }
      ],
      "current_branch": {
        "id": "branch-uuid-1",
        "name": "Headquarters"
      },
      "is_multi_branch": true,
      "organization": {
        "id": "org-uuid",
        "name": "Acme Corp"
      }
    }
    ```

### **Switch Branch**
*   **Endpoint:** `POST /api/v1/auth/branches/switch-branch/`
*   **Workflow:** Updates the user's session mechanism to focus on a different branch ID.
*   **Input JSON:**
    ```json
    {
      "branch_id": "target-branch-uuid"
    }
    ```

## 2. Core (`/api/v1/core/`)

### **Organizations**
*   **Endpoint:** `GET /api/v1/core/organizations/` (Admin only)
*   **Workflow:** List all organizations (for superadmin).
*   **Output JSON:** (List of Organization objects)

### **Organization Details**
*   **Endpoint:** `GET /api/v1/core/organizations/{id}/`
*   **Output JSON:**
    ```json
    {
      "id": "uuid",
      "name": "Acme Corp",
      "logo": "url",
      "email": "contact@acme.com",
      "subscription_status": "active",
      "timezone": "Asia/Kolkata",
      "currency": "INR"
    }
    ```

## 3. Expenses (`/api/v1/expenses/`)

### **My Claims**
*   **Endpoint:** `GET /api/v1/expenses/claims/` (Filtered by owner)
*   **Workflow:** Employee views their own expense claims.
*   **Output JSON:**
    ```json
    [
      {
        "id": "uuid",
        "title": "Travel to NYC",
        "amount": "500.00",
        "status": "pending", // pending, approved, rejected, paid
        "created_at": "2023-10-27T10:00:00Z",
        "items": [...]
      }
    ]
    ```

### **Submit Claim**
*   **Endpoint:** `POST /api/v1/expenses/claims/`
*   **Input JSON:**
    ```json
    {
      "title": "Client Lunch",
      "items": [
        {
          "category_id": "uuid",
          "amount": 150.00,
          "date": "2023-10-27",
          "description": "Lunch with Client X"
        }
      ]
    }
    ```

## 4. Payroll (`/api/v1/payroll/`)

### **Payslips**
*   **Endpoint:** `GET /api/v1/payroll/payslips/`
*   **Workflow:** Employee downloads or Views payslips.
*   **Output JSON:**
    ```json
    [
      {
        "id": "uuid",
        "month": "October 2023",
        "net_salary": 50000,
        "pdf_url": "http://.../payslip.pdf",
        "status": "published"
      }
    ]
    ```

## 5. Employees (`/api/v1/employees/`)

*   **Employees**: `GET/POST /employees/` (List/Create), `GET/PUT /employees/{id}/` (Retrieve/Update)
*   **Departments**: `GET/POST /departments/`
*   **Designations**: `GET/POST /designations/`
*   **Locations**: `GET/POST /locations/`
*   **Skills**: `GET/POST /skills/`
*   **Transfers**: `GET/POST /transfers/`
*   **Promotions**: `GET/POST /promotions/`
*   **Resignations**: `GET/POST /resignations/`
*   **Exit Interviews**: `GET/POST /exit-interviews/`
*   **Bank Accounts**: `GET/POST /bank-accounts/`
*   **Emergency Contacts**: `GET/POST /emergency-contacts/`
*   **Dependents**: `GET/POST /dependents/`

### **Employee Object JSON**
```json
{
  "id": "uuid",
  "user": "uuid",
  "department": {"id": "uuid", "name": "Engineering"},
  "designation": {"id": "uuid", "name": "Senior Dvlpr"},
  "reporting_manager": "uuid",
  "date_of_joining": "2023-01-01",
  "employee_id": "EMP001",
  "status": "active"
}
```

## 6. Attendance (`/api/v1/attendance/`)

*   **Records**: `GET /records/` (List attendance), `POST /records/check-in/` (Clock in), `POST /records/check-out` (Clock out)
*   **Shifts**: `GET/POST /shifts/`
*   **Geo Fences**: `GET/POST /geo-fences/`
*   **Fraud Logs**: `GET /fraud-logs/`

### **Attendance Record JSON**
```json
{
  "id": "uuid",
  "employee": "uuid",
  "date": "2023-10-27",
  "check_in": "09:00:00",
  "check_out": "18:00:00",
  "total_hours": "9.0",
  "status": "present"
}
```

## 7. Leave (`/api/v1/leave/`)

*   **Requests**: `GET/POST /requests/` (Apply/List), `POST /requests/{id}/approve/` (Approve), `POST /requests/{id}/reject/` (Reject)
*   **Balances**: `GET /balances/`
*   **Types**: `GET/POST /types/` (Sick, Casual, etc)
*   **Policies**: `GET/POST /policies/`
*   **Holidays**: `GET/POST /holidays/`

### **Leave Request JSON**
```json
{
  "id": "uuid",
  "leave_type": "Sick Leave",
  "start_date": "2023-10-28",
  "end_date": "2023-10-29",
  "reason": "Fever",
  "status": "pending"
}
```

## 8. Recruitment (`/api/v1/recruitment/`)

*   **Jobs**: `GET/POST /jobs/`
*   **Candidates**: `GET/POST /candidates/`
*   **Applications**: `GET/POST /applications/`
*   **Interviews**: `GET/POST /interviews/`
*   **Offers**: `GET/POST /offers/`

### **Job Application JSON**
```json
{
  "id": "uuid",
  "job": "uuid",
  "candidate": "uuid",
  "status": "applied", // applied, interview_scheduled, hired, rejected
  "resume": "http://.../resume.pdf"
}
```

## 9. Performance (`/api/v1/performance/`)

*   **Cycles**: `GET/POST /cycles/` (e.g. Q4 2023)
*   **OKRs**: `GET/POST /okrs/`
*   **Reviews**: `GET/POST /reviews/`
*   **Feedback**: `GET/POST /feedback/`
*   **KRKs/KPIs**: `GET/POST /kras/`, `GET/POST /kpis/`

## 10. Chat (`/api/v1/chat/`)

*   **Conversations**: `GET/POST /conversations/`
*   **Messages**: `GET/POST /messages/`

### **Message JSON**
```json
{
  "id": "uuid",
  "conversation": "uuid",
  "sender": "uuid",
  "content": "Hello world",
  "created_at": "ISO8601"
}
```

## 11. Assets (`/api/v1/assets/`)

*   **Assets**: `GET/POST /assets/`
*   **Categories**: `GET/POST /categories/`
*   **Assignments**: `GET/POST /assignments/` (Assign asset to employee)

## 12. Billing (`/api/v1/billing/`)

*   **Plans**: `GET/POST /plans/`
*   **Subscriptions**: `GET/POST /subscriptions/`
*   **Invoices**: `GET/POST /invoices/`
*   **Payments**: `GET/POST /payments/`
*   **Bank Details**: `GET/POST /bank-details/`

## 13. Onboarding (`/api/v1/onboarding/`)

*   **Onboardings**: `GET/POST /onboardings/` (Employee processes)
*   **Templates**: `GET/POST /templates/`
*   **Task Templates**: `GET/POST /task-templates/`
*   **Tasks**: `GET/POST /tasks/` (Individual task progress)
*   **Documents**: `GET/POST /documents/`

## 14. Notifications (`/api/v1/notifications/`)

*   **Notifications**: `GET /` (List user notifs), `POST /mark-read/`
*   **Templates**: `GET/POST /templates/` (Admin)
*   **Preferences**: `GET/PUT /preferences/`

## 15. Workflows (`/api/v1/workflows/`)

*   **Definitions**: `GET/POST /definitions/` (Design workflows)
*   **Steps**: `GET/POST /steps/`
*   **Instances**: `GET/POST /instances/` (Running workflows)

## 16. Reports (`/api/v1/reports/`)

*   **Reports**: `GET /` (List available reports), `GET /{id}/run/`
*   **Dashboard**: `GET /dashboard/` (Aggregated metrics)

## 17. ABAC (`/api/v1/abac/`)

*   **Policies**: `GET/POST /policies/`
*   **Rules**: `GET/POST /policy-rules/`
*   **User Policies**: `GET/POST /user-policies/`
*   **Attribute Types**: `GET/POST /attribute-types/`
*   **Logs**: `GET /policy-logs/` (Audit decisions)

## 18. Other Enterprise Modules

*   **Compliance**: `/api/v1/compliance/` (retention, consents, legal-holds)
*   **Integrations**: `/api/v1/integrations/` (external, webhooks, api-keys)
*   **AI Services**: `/api/v1/ai/` (models, predictions)

---
**Note:**
- **Standard CRUD**: Most endpoints support `GET` (List), `POST` (Create), `GET {id}` (Retrieve), `PUT/PATCH {id}` (Update), `DELETE {id}` (Remove).
- **Pagination**: List endpoints allow `?page=1&page_size=20`.
- **Filtering**: Most lists support filters like `?status=active&employee_id=...`.
