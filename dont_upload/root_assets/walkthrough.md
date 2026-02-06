# HRMS Org-Based Walkthrough (Quick Start)

## 1) Services
- Start stack: `docker-compose up -d`
- Backend health: http://localhost:8000/api/health/
- Admin UI: http://localhost:8000/admin/
- Frontend: http://localhost:3000/

## 2) Credentials
- Superuser (backend admin): username `admin`, password `admin123`, email `admin@example.com`

## 3) Create an Organization (via Admin)
- Go to Admin → Organizations → Add Organization.
- Required: name, slug, email.
- Save: a default admin user is **auto-created** with:
  - Username: `<slug>@<slug>.local` (e.g., `pp@pp.local`)
  - Email: organization's email
  - Random password (you must set a new password)
  - Permissions: auto-enabled (`is_staff`, `is_active`, `is_verified`)
- After creating the org, you'll see a success message with the username

## 4) Set Password for Auto-Created User
- Go to Admin → Users
- Find the user (e.g., `pp@pp.local`)
- Click to edit → scroll to password field → click "this form" link
- Set a password (e.g., `ppcp1234`) and save

## 5) Login as Organization User
- **Username**: The auto-generated username (e.g., `pp@pp.local`)
- **Password**: The password you set in step 4
- Login at: http://localhost:8000/admin/

## 6) Create Additional Org Users
- Go to Admin → Users → Add User
- Fill in required fields:
  - **Organization**: Select the organization
  - **Username**: Any unique username (e.g., `pp-user2`, `john@pp.com`)
  - **Email**: User's email
  - **First/Last name**
  - **Password**: Set via "this form" link
- **Permissions auto-enabled**: `is_staff`, `is_active`, `is_verified` are automatically set
- Save the user

## 7) API Smoke Test (shell inside backend)
- `docker-compose exec backend /bin/sh`
- `python manage.py shell` then:
```python
from django.contrib.auth import get_user_model
from apps.core.models import Organization

org = Organization.objects.first()
user = get_user_model().objects.filter(organization=org).first()
print(org, user)
```

## 8) Context & Isolation
- Organization context is set by `OrganizationMiddleware` using the authenticated user’s organization.
- Queries on org-scoped models auto-filter via `OrganizationManager`.
- In production, missing org context raises RuntimeError (safety).

## 9) Common Ops
- Rebuild backend after code changes: `docker-compose build backend --no-cache && docker-compose up -d backend`
- Run migrations: `docker-compose exec backend python manage.py migrate`
- Create additional superuser: `docker-compose exec backend python manage.py createsuperuser`

## 10) Troubleshooting
- **Login fails**: Verify you set a password for the auto-created user and use the correct username (e.g., `pp@pp.local`)
- **No user auto-created**: Check backend logs for signal errors; restart backend if needed
- Health 500 / login errors: ensure migrations applied and backend rebuilt.
- Containers unhealthy: `docker ps`, then `docker logs <container>` for details.
