# PS IntelliHR Backend

Enterprise-grade, multi-tenant HRMS SaaS backend

---

## Overview

PS IntelliHR Backend is the core server-side platform powering **PS IntelliHR**, an enterprise Human Resource Management System (HRMS) designed for scalability, security, and compliance.

The backend is built using modern Django and cloud-native components, following **enterprise SaaS architecture principles**. It supports secure multi-tenant organizations, API-first design, asynchronous background processing, and real-time capabilities.

The system is **production-ready** and architected with a **SOC 2 / ISO 27001 mindset**, making it suitable for enterprise, B2B SaaS, and regulated environments.

---

## Key Capabilities

- Django 4.2+ with fully custom user model  
- Django REST Framework (API-first architecture)  
- Organization-based multi-tenant SaaS design  
- Strong tenant isolation and access enforcement  
- JWT-based authentication  
- Hardened production settings and secure secrets  
- PostgreSQL 16 for relational data  
- Redis for caching and message brokering  
- Celery for background job processing  
- Django Channels for real-time features  
- OpenAPI / Swagger documentation via drf-spectacular  
- Docker & Docker Compose support  
- Cloud-ready, containerized deployment  

---

## Technology Stack

- **Backend:** Django, Django REST Framework  
- **Database:** PostgreSQL 16  
- **Cache / Broker:** Redis  
- **Async Processing:** Celery  
- **Realtime:** Django Channels  
- **API Docs:** drf-spectacular  
- **DevOps:** Docker, Docker Compose  

---

## System Architecture

### High-Level Architecture Diagram

┌────────────────────┐
│ Client Apps │
│ (Web / Mobile) │
└─────────┬──────────┘
│ HTTPS / JSON (REST, WebSocket)
▼
┌─────────────────────────────┐
│ API Gateway │
│ Django + DRF (JWT Auth) │
└─────────┬──────────┬────────┘
│ │
│ │ WebSocket
│ ▼
│ ┌──────────────────────┐
│ │ Django Channels │
│ │ (Realtime Layer) │
│ └─────────┬────────────┘
│ │
▼ ▼
┌─────────────────────────────┐
│ Application Layer │
│ Multi-Tenant Business │
│ Logic & RBAC Enforcement │
└─────────┬──────────┬────────┘
│ │
│ │ Async Tasks
▼ ▼
┌────────────────┐ ┌───────────────────┐
│ PostgreSQL 16 │ │ Celery Workers │
│ (Primary DB) │ │ Background Jobs │
└────────────────┘ └─────────┬─────────┘
│
▼
┌────────────────┐
│ Redis │
│ Cache / Broker │
└────────────────┘


---

## Architecture Principles

- **Multi-Tenancy:**  
  Every request is scoped to an organization with strict tenant isolation.

- **API-First Design:**  
  Backend serves versioned REST APIs, enabling multiple frontend clients.

- **Asynchronous Processing:**  
  Long-running tasks (emails, reports, notifications) handled by Celery.

- **Real-Time Capabilities:**  
  WebSocket support via Django Channels for live updates and notifications.

- **Security by Design:**  
  JWT authentication, hardened settings, and environment-based secrets.

- **Scalability:**  
  Stateless backend services with horizontally scalable workers.

---

## Quick Start (Local Development)

### Clone the repository
```sh
git clone git@github.com:ppcppankaj/psintellihrms.git
cd psintellihrms/backend

cp .env.production.example .env

docker compose up --build -d


docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

docker compose exec backend python manage.py createsuperuser


Access API documentation

Swagger UI: http://localhost:8001/api/docs/

ReDoc: http://localhost:8001/api/redoc/

Production Readiness

This backend has undergone a structured production audit covering:

Secure configuration and secrets management

Multi-tenant enforcement and data isolation

Authentication and authorization boundaries

Background job reliability and retries

Deployment hardening and operational readiness

Refer to PRODUCTION_READINESS_REPORT.md for full audit details and remediation status.

Common Development Commands

Run test suite:

docker compose exec backend pytest


Inspect migrations:

docker compose exec backend python manage.py showmigrations


Run Celery worker:

docker compose exec backend celery -A config worker -l info

License & Ownership

This project is proprietary software.

For licensing, commercial usage, or enterprise inquiries, contact:

Pankaj Sharma
https://pankaj.im

© PS IntelliHR. All rights reserved.


---
