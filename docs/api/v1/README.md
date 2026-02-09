# PS IntelliHR API v1

**Base URL:** `/api/v1/`  
**OpenAPI Version:** 3.0.3  
**Contract Frozen:** 2026-02-09

---

## Authentication

All API endpoints require JWT authentication.

### Obtain Token

```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLC...",
  "refresh": "eyJ0eXAiOiJKV1QiLC..."
}
```

### Using the Token

```http
Authorization: Bearer <access_token>
X-Tenant-ID: <organization_id>
```

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10 req/min |
| Read (GET) | 1000 req/min |
| Write (POST/PUT/PATCH) | 100 req/min |
| Bulk Operations | 10 req/min |

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Error Responses

All errors follow a consistent format:

```json
{
  "detail": "Error message",
  "code": "error_code",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Field Semantics

### Required vs Optional

- **Required fields**: Must be provided on create, cannot be null
- **Optional fields**: Can be omitted or set to null
- **Read-only fields**: Returned in responses, ignored in requests

### Common Fields

All entities include:
- `id` (UUID, read-only)
- `organization` (UUID, read-only, auto-set)
- `created_at` (datetime, read-only)
- `updated_at` (datetime, read-only)
- `is_active` (boolean)

---

## Pagination

List endpoints use cursor-based pagination:

```http
GET /api/v1/employees/?limit=20&offset=0
```

**Response:**
```json
{
  "count": 150,
  "next": "/api/v1/employees/?limit=20&offset=20",
  "previous": null,
  "results": [...]
}
```

---

## Filtering & Sorting

### Filtering
```http
GET /api/v1/employees/?department=uuid&status=active
```

### Sorting
```http
GET /api/v1/employees/?ordering=-created_at
```

Prefix with `-` for descending order.

---

## API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Authentication | `/auth/` | Login, logout, token refresh |
| Employees | `/employees/` | Employee management |
| Leave | `/leave/` | Leave requests, balances |
| Attendance | `/attendance/` | Check-in/out, timesheets |
| Payroll | `/payroll/` | Salary, payslips |
| Performance | `/performance/` | Reviews, OKRs, KPIs |
| Recruitment | `/recruitment/` | Jobs, applications |
| Training | `/training/` | Programs, enrollments |
| Workflows | `/workflows/` | Approvals, escalations |
| Reports | `/reports/` | Analytics, exports |

---

## SDK Generation

Generate client SDKs from the OpenAPI schema:

```bash
# TypeScript
npx @openapitools/openapi-generator-cli generate \
  -i api-contracts/v1/baseline.yaml \
  -g typescript-axios \
  -o sdk/typescript

# Python
openapi-generator generate \
  -i api-contracts/v1/baseline.yaml \
  -g python \
  -o sdk/python
```

---

## Contract Guarantees

1. **No breaking changes** to existing endpoints
2. **Additive changes only** (new fields, new endpoints)
3. **12-month deprecation notice** before any removal
4. **Semantic versioning** for breaking changes (`/api/v2/`)
