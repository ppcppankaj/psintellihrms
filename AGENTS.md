# AGENTS.md - PS IntelliHR

## Commands
- **Start stack**: `docker compose up --build -d`
- **Backend tests**: `docker compose exec backend pytest` (single: `pytest apps/module/tests/test_file.py::test_name -v`)
- **Frontend lint**: `cd frontend_v2 && npm run lint`
- **Frontend build**: `cd frontend_v2 && npm run build`
- **Django manage**: `docker compose exec backend python manage.py <cmd>`

## Architecture
- **Backend**: Django 4.2+ / DRF at `backend/` with apps in `backend/apps/` (authentication, employees, payroll, leave, attendance, etc.)
- **Frontend**: React 19 + Vite + TypeScript + Redux Toolkit + TailwindCSS at `frontend_v2/`
- **Database**: PostgreSQL 16 (multi-tenant, org-based); Redis for caching/Celery
- **Config**: Django settings in `backend/config/settings/`, env vars from `.env`

## Code Style
- Python: snake_case, type hints encouraged, DRF serializers/viewsets pattern
- TypeScript: ESLint configured, functional components, Redux slices for state
- Models inherit from `core` mixins for org-scoping; use `OrganizationFilterMixin` for querysets
- API endpoints under `/api/` with JWT auth (access + refresh tokens)
- Error handling: DRF exceptions; frontend axios interceptors for 401 refresh
