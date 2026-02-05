# PS IntelliHR Backend

Enterprise HRMS SaaS Backend

---

## Overview
This is the backend for PS IntelliHR, a multi-tenant HRMS platform built with Django, Django REST Framework, PostgreSQL, Redis, Celery, and Channels. It is production-ready and follows enterprise SaaS standards.

---

## Features
- Django 4.2+ with custom user model
- Multi-tenant (organization-based) architecture
- REST API with JWT authentication
- PostgreSQL 16, Redis, Celery, Channels
- drf-spectacular for OpenAPI schema
- Docker & docker-compose support
- Hardened for production (SOC2/ISO mindset)

---

## Quick Start

1. **Clone the repository:**
   ```sh
   git clone git@github.com:ppcppankaj/psintellihrms.git
   cd psintellihrms/backend
   ```

2. **Configure environment:**
   - Copy `.env.production.example` to `.env` and set all required secrets.

3. **Build and start services:**
   ```sh
   docker compose up --build -d
   ```

4. **Run migrations:**
   ```sh
   docker compose exec backend python manage.py makemigrations
   docker compose exec backend python manage.py migrate
   ```

5. **Create superuser:**
   ```sh
   docker compose exec backend python manage.py createsuperuser
   ```

6. **Access API docs:**
   - Swagger: `http://localhost:8001/api/docs/`
   - ReDoc: `http://localhost:8001/api/redoc/`

---

## Production Readiness
- See `PRODUCTION_READINESS_REPORT.md` for full audit and remediation details.
- Hardened settings, secure secrets, and multi-tenancy enforced.

---

## Useful Commands
- **Run backend tests:**
  ```sh
  docker compose exec backend pytest
  ```
- **Show migrations:**
  ```sh
  docker compose exec backend python manage.py showmigrations
  ```
- **Celery worker:**
  ```sh
  docker compose exec backend celery -A config worker -l info
  ```

---

## License
Contact project owner for licensing details.
