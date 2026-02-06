# PS IntelliHR - Quick Start Guide

## ✅ All Errors Fixed!

**What was fixed:**
1. ✅ Migrations regenerated for all 21 apps
2. ✅ Database schema created successfully  
3. ✅ Docker compose version warning removed
4. ✅ Seed script created for initial data
5. ✅ Public tenant/domain setup automated

---

## Next: Start Docker Desktop & Launch

### Step 1: Start Docker Desktop

Make sure Docker Desktop is running (check system tray).

### Step 2: Launch Services

```powershell
cd C:\Users\ruchi\ppcp\hrms
docker-compose -f docker-compose.dev.yml up
```

### Step 3: Seed Database (First Time Only)

In a new terminal:

```powershell
docker-compose -f docker-compose.dev.yml run --rm backend python manage.py shell < backend/seed_data.py
```

This creates:
- ✅ Public tenant with localhost domain
- ✅ Admin user (admin@psintellhr.com / admin123)
- ✅ Demo tenant for testing

---

## Access Points

- **Admin Panel**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/docs/
- **Health Check**: http://localhost:8000/api/health/
- **Frontend**: http://localhost:3000/ (if built)

### Login Credentials

```
Email: admin@psintellhr.com
Password: admin123
```

---

## Architecture Summary

### Multi-Tenant Django App

**Public Schema** (shared):
- Users, Tenants, Domains, Billing
- Endpoints: `/admin/`, `/api/v1/auth/`, `/api/v1/tenants/`, `/api/v1/billing/`

**Tenant Schemas** (isolated per company):
- Employees, Attendance, Leave, Payroll, Performance, etc.
- Endpoints: All other `/api/v1/*`
- Access: Via subdomain (`demo.localhost:8000`) or header (`X-Tenant-Slug: demo`)

### Request Flow

```
HTTP Request
    ↓
TenantRoutingMiddleware
    ↓
Resolve Tenant (header/subdomain/domain)
    ↓
Set PostgreSQL Schema
    ↓
Route to View
    ↓
Response (with X-Tenant-ID header)
```

---

## Key Components

### Backend Apps (21 total)

**Shared (Public Schema):**
- `tenants` - Multi-tenant management
- `authentication` - Users, sessions, 2FA
- `billing` - Plans, subscriptions, invoices

**Tenant-Specific:**
- `employees` - Employee records, departments
- `attendance` - Punch logs, face recognition, geo-fencing
- `leave` - Leave requests, policies, balances
- `payroll` - Salary, tax, PF, payslips
- `performance` - Reviews, KPIs, OKRs
- `recruitment` - Job postings, candidates, interviews
- `onboarding` - Onboarding workflows, tasks
- `expenses` - Expense claims, approvals
- `assets` - Asset tracking, assignments
- `workflows` - Approval workflows
- `notifications` - Email/SMS/Slack notifications
- `reports` - Report generation
- `compliance` - GDPR, data retention
- `integrations` - API keys, webhooks
- `ai_services` - ML predictions
- `chat` - Internal messaging
- `core` - Shared utilities, middleware

### Tech Stack

- **Backend**: Django 5.0 + DRF + django-tenants
- **Database**: PostgreSQL 16 (multi-schema)
- **Cache/Queue**: Redis 7
- **Task Queue**: Celery + Beat
- **WebSockets**: Django Channels
- **Auth**: JWT (simplejwt) + 2FA (TOTP)
- **API Docs**: drf-spectacular (OpenAPI 3.0)
- **Frontend**: React + TypeScript + Vite + TailwindCSS

---

## Common Commands

### Docker

```powershell
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild images
docker-compose -f docker-compose.dev.yml build

# Fresh start (removes volumes)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up
```

### Django Management

```powershell
# Run any Django command
docker-compose -f docker-compose.dev.yml run --rm backend python manage.py <command>

# Examples:
docker-compose -f docker-compose.dev.yml run --rm backend python manage.py makemigrations
docker-compose -f docker-compose.dev.yml run --rm backend python manage.py migrate
docker-compose -f docker-compose.dev.yml run --rm backend python manage.py createsuperuser
docker-compose -f docker-compose.dev.yml run --rm backend python manage.py shell
```

---

## Testing Endpoints

### Health Check

```bash
curl http://localhost:8000/api/health/
# Expected: {"status": "ok", "service": "hrms-backend"}
```

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@psintellhr.com", "password": "admin123"}'
```

### Access Tenant API (with JWT token)

```bash
# Via header
curl http://localhost:8000/api/v1/employees/ \
  -H "X-Tenant-Slug: demo" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Troubleshooting

### Port Already in Use

```powershell
# Find process
netstat -ano | findstr :8000
# Kill it
taskkill /PID <PID> /F
```

### Restart Fresh

```powershell
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up
# Re-run seed script
```

### View Django Logs

```powershell
docker-compose -f docker-compose.dev.yml logs -f backend
```

---

## Development Workflow

1. **Code Changes**: Edit files → Auto-reload in container
2. **Model Changes**: 
   - Edit models
   - `docker-compose run backend python manage.py makemigrations`
   - `docker-compose run backend python manage.py migrate`
3. **Add Dependencies**: Edit `requirements/*.txt` → Rebuild image
4. **Frontend Changes**: Edit React files → Vite hot-reload

---

## Production Notes

For production deployment:
1. Use `docker-compose.yml` (not `.dev.yml`)
2. Set `DJANGO_SETTINGS_MODULE=config.settings.production`
3. Provide all required secrets (no defaults)
4. Use proper domain with SSL
5. Run `collectstatic` in Dockerfile
6. Use Gunicorn/Uvicorn (not runserver)
7. Set up DB backups

---

## Project Structure

```
hrms/
├── backend/
│   ├── apps/           # 21 Django apps
│   ├── config/         # Settings, URLs, ASGI/WSGI
│   ├── requirements/   # Dependencies
│   ├── manage.py
│   ├── Dockerfile
│   └── seed_data.py    # Database seeding
├── frontend/
│   ├── src/           # React components
│   ├── Dockerfile
│   └── package.json
├── docker-compose.dev.yml   # Development
├── docker-compose.yml       # Production
└── QUICKSTART.md           # This file
```

---

## Status Summary

| Component | Status |
|-----------|--------|
| Migrations | ✅ Created for all apps |
| Database Schema | ✅ Ready (after `migrate`) |
| Docker Setup | ✅ Configured |
| Seed Script | ✅ Created |
| Public Tenant | 🔄 Run seed script |
| Admin User | 🔄 Run seed script |
| Services | 🔄 Start Docker Desktop |

---

**Ready to launch!** Start Docker Desktop and run `docker-compose up`. 🚀
