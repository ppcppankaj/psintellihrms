# API Versioning Strategy

## Overview

PS IntelliHR follows semantic versioning for its API contract.

| Version | Status | EOL |
|---------|--------|-----|
| v1 | **Active (Frozen)** | TBD |
| v2 | Planned | - |

---

## Version Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Active    │ ──▶ │ Deprecated  │ ──▶ │   Sunset    │
│  (Current)  │     │ (12 months) │     │  (Removed)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## URL Structure

```
https://api.example.com/api/v1/employees/
https://api.example.com/api/v2/employees/
```

Both versions can coexist indefinitely.

---

## When to Create v2

A new major version is required when:

1. **Removing fields** from response payloads
2. **Renaming fields** in requests/responses
3. **Changing field types** (e.g., string → integer)
4. **Making optional fields required**
5. **Changing authentication mechanisms**
6. **Restructuring response shapes**
7. **Removing endpoints**

---

## v1 → v2 Migration

### Phase 1: Development
- Create `/api/v2/` namespace
- Implement breaking changes
- Maintain v1 unchanged

### Phase 2: Beta
- Release v2 to select clients
- Gather feedback
- Document migration guide

### Phase 3: General Availability
- Announce v2 GA
- Begin v1 deprecation clock (12 months)
- Provide migration tooling

### Phase 4: Deprecation
- v1 returns deprecation headers
- Monitor v1 usage
- Notify remaining v1 clients

### Phase 5: Sunset
- v1 returns 410 Gone
- Remove v1 code (optional)

---

## Coexistence Rules

### Shared Components
- Models and database remain unified
- Business logic shared via services
- Only serializers/views differ

### Code Organization

```
apps/
├── employees/
│   ├── models.py          # Shared
│   ├── services.py        # Shared
│   ├── serializers.py     # v1 serializers
│   ├── serializers_v2.py  # v2 serializers
│   ├── views.py           # v1 views
│   └── views_v2.py        # v2 views
```

### URL Configuration

```python
# config/urls.py
urlpatterns = [
    path('api/v1/', include('config.api_v1_urls')),
    path('api/v2/', include('config.api_v2_urls')),  # When ready
]
```

---

## Deprecation Headers

When v1 is deprecated, responses include:

```http
Deprecation: true
Sunset: Sat, 01 Feb 2028 00:00:00 GMT
Link: </api/v2/employees/>; rel="successor-version"
```

---

## Client Recommendations

1. **Pin to specific version** in SDK configuration
2. **Monitor deprecation headers** in production
3. **Subscribe to API changelog** for updates
4. **Test against v2** before migration deadline
