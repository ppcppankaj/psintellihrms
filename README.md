docker compose up --build -d
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend pytest
docker compose exec backend python manage.py showmigrations
docker compose exec backend celery -A config worker -l info

<div align="center">
  <img src="https://raw.githubusercontent.com/ppcppankaj/psintellihrms/main/assets/logo.png" alt="PS IntelliHR" width="180" />
  
  <h1>PS IntelliHR Backend</h1>
  <p><b>Enterprise-grade, multi-tenant HRMS SaaS backend</b></p>
  <p>
    <a href="https://www.djangoproject.com/" target="_blank"><img src="https://img.shields.io/badge/Django-4.2%2B-green" alt="Django"></a>
    <a href="https://www.postgresql.org/" target="_blank"><img src="https://img.shields.io/badge/PostgreSQL-16-blue" alt="PostgreSQL"></a>
    <a href="https://www.docker.com/" target="_blank"><img src="https://img.shields.io/badge/Docker-ready-blue" alt="Docker"></a>
    <a href="https://github.com/ppcppankaj/psintellihrms/actions" target="_blank"><img src="https://img.shields.io/github/workflow/status/ppcppankaj/psintellihrms/CI?label=build" alt="Build Status"></a>
  </p>
</div>


## 🚀 Overview

PS IntelliHR Backend powers the core of the **PS IntelliHR** platform, delivering secure, scalable, and compliant HRMS for multi-tenant organizations. Built with Django, DRF, PostgreSQL, Redis, Celery, and Channels, it is production-audited and ready for enterprise deployment.

---

## 🛠️ Features

- Multi-tenant, organization-based SaaS
- Custom user model & JWT authentication
- Strong tenant isolation & RBAC/ABAC enforcement
- PostgreSQL 16, Redis, Celery, Channels
- OpenAPI/Swagger docs via drf-spectacular
- Docker & docker-compose support
- Hardened for SOC2/ISO production

---

## 📦 Technology Stack

| Layer         | Technology                |
|--------------|---------------------------|
| Backend      | Django, DRF               |
| Database     | PostgreSQL 16             |
| Cache/Broker | Redis                     |
| Async        | Celery                    |
| Realtime     | Django Channels           |
| API Docs     | drf-spectacular           |
| DevOps       | Docker, Docker Compose    |

---

## 🏗️ Architecture

<details>
<summary>High-Level Diagram</summary>

```
Client Apps (Web/Mobile)
        │
  HTTPS/REST/WebSocket
        ▼
API Gateway (Django + DRF)
        │
        ▼
Application Layer (Multi-Tenant Logic)
        │
        ▼
PostgreSQL 16 ── Celery Workers
        │           │
        └───── Redis (Cache/Broker)
```
</details>

---

## ⚡ Quick Start

```sh
# Clone & setup
git clone git@github.com:ppcppankaj/psintellihrms.git
cd psintellihrms/backend
cp .env.production.example .env

# Build & run
docker compose up --build -d

# Migrate & create superuser
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser

# Access API docs
# Swagger: http://localhost:8001/api/docs/
# ReDoc:   http://localhost:8001/api/redoc/
```

---

## 🏆 Production Readiness

- Full audit: see `PRODUCTION_READINESS_REPORT.md`
- Secure config, secrets, and multi-tenancy
- Background job reliability and retry
- Deployment hardening and operational readiness

---

## 🧑‍💻 Common Commands

```sh
# Run tests
docker compose exec backend pytest

# Show migrations
docker compose exec backend python manage.py showmigrations

# Run Celery worker
docker compose exec backend celery -A config worker -l info
```

---

## 📄 License & Contact

This project is proprietary software.

For licensing, commercial usage, or enterprise inquiries, contact:

**Pankaj Sharma**  
[https://pankaj.im](https://pankaj.im)

© PS IntelliHR. All rights reserved.
ReDoc: http://localhost:8001/api/redoc/
