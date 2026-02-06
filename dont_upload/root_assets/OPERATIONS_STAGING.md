# Staging Environment Operations Guide

## Overview

The staging environment is a **production-exact copy** for testing before launching to production. Use it to:
- Validate deployments
- Test migrations
- Perform load testing
- Verify tenant isolation
- Test emergency procedures

## Quick Start

### 1. Build & Start Staging

```bash
# Option A: Local staging (Docker Compose)
docker-compose -f docker-compose.staging.yml up -d

# Verify all services
docker-compose -f docker-compose.staging.yml ps

# Option B: Cloud staging (requires Kubernetes)
kubectl apply -f staging/kube-manifest.yaml
kubectl port-forward svc/staging-backend 8001:8000
```

### 2. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Backend** | http://localhost:8001 | Admin created via entrypoint |
| **Frontend** | http://localhost:5174 | Use backend credentials |
| **Admin Panel** | http://localhost:8001/admin | admin@staging.psintellhr.com / staging123 |
| **Nginx** | http://localhost:8080 | Proxies backend + frontend |
| **Database** | localhost:5433 | postgres / staging_password_123 |
| **Redis** | localhost:6380 | No auth by default |

### 3. Verify Deployment

```bash
# Check migrations applied
docker-compose -f docker-compose.staging.yml exec backend python manage.py showmigrations

# Check health
curl http://localhost:8001/api/health/

# Check public tenant
docker-compose -f docker-compose.staging.yml exec backend python manage.py shell
>>> from apps.tenants.models import Tenant
>>> Tenant.objects.all()

# Run diagnostics
docker-compose -f docker-compose.staging.yml exec backend python manage.py diagnose
```

## Environment Variables

Create `.env.staging`:

```bash
# Docker
COMPOSE_PROJECT_NAME=staging

# Database
STAGING_DB_USER=postgres
STAGING_DB_PASSWORD=staging_password_123
STAGING_DB_NAME=hrms_staging

# Django
STAGING_SECRET_KEY=your-staging-secret-key-here
STAGING_ALLOWED_HOSTS=localhost,127.0.0.1,staging.internal,backend
DEBUG=False

# Admin User
STAGING_SUPERUSER_EMAIL=admin@staging.psintellhr.com
STAGING_SUPERUSER_PASSWORD=staging123

# Frontend
STAGING_FRONTEND_API_URL=http://localhost:8001

# Optional: S3 for backups
STAGING_S3_BUCKET=company-staging-backups
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

Load variables:

```bash
export $(cat .env.staging | xargs)
docker-compose -f docker-compose.staging.yml up -d
```

## Testing Workflows

### ✅ Pre-Deployment Checklist

Run this before promoting staging to production:

```bash
#!/bin/bash
# save as scripts/staging_prelaunch_check.sh

set -e

echo "🔍 Pre-Launch Staging Check"

# 1. Migrations
echo "1/7: Checking migrations..."
docker-compose -f docker-compose.staging.yml exec backend \
  python manage.py migrate --check --plan

# 2. Tenant isolation tests
echo "2/7: Running tenant isolation tests..."
docker-compose -f docker-compose.staging.yml exec backend \
  pytest apps/tenants/tests/test_tenant_isolation.py -v

# 3. Diagnostics
echo "3/7: Running diagnostics..."
docker-compose -f docker-compose.staging.yml exec backend \
  python manage.py diagnose

# 4. Backend health
echo "4/7: Checking backend health..."
curl -f http://localhost:8001/api/health/ || exit 1

# 5. Database integrity
echo "5/7: Checking database integrity..."
docker-compose -f docker-compose.staging.yml exec db \
  pg_dump --no-acl --no-owner hrms_staging | grep -q "CREATE TABLE" || exit 1

# 6. Frontend build
echo "6/7: Checking frontend..."
curl -f http://localhost:5174 > /dev/null || exit 1

# 7. Load test (optional, see next section)
echo "7/7: Pre-launch checks complete ✓"
```

Run it:

```bash
chmod +x scripts/staging_prelaunch_check.sh
./scripts/staging_prelaunch_check.sh
```

### ✅ Deployment Promotion (Staging → Production)

**Step 1: Final validation in staging**

```bash
# Run full test suite
docker-compose -f docker-compose.staging.yml exec backend pytest -v

# Backup staging data (for rollback reference)
docker-compose -f docker-compose.staging.yml exec db \
  pg_dump --no-acl --no-owner hrms_staging > backups/staging_prelaunch_backup.sql
```

**Step 2: Prepare production**

```bash
# Ensure production database backed up
./scripts/backup_postgres.sh full

# Verify backup
./scripts/backup_postgres.sh verify /app/backups/full/latest.sql.gz
```

**Step 3: Deploy to production**

```bash
# Production uses docker-compose.yml (not staging)
docker-compose -f docker-compose.yml pull  # Get latest images

# Stop current production gracefully
docker-compose -f docker-compose.yml stop backend celery beat

# Backup database (pre-flight)
docker-compose -f docker-compose.yml exec db \
  pg_dump --no-acl --no-owner hrms_db > backups/prelaunch_backup_$(date +%s).sql

# Start new production (auto-migrate)
docker-compose -f docker-compose.yml up -d
```

**Step 4: Verify production**

```bash
# Check health
curl https://api.psintellhr.com/api/health/

# Check migrations
docker-compose -f docker-compose.yml exec backend python manage.py showmigrations

# Monitor errors
docker-compose -f docker-compose.yml logs -f backend --tail=50
```

**Step 5: Rollback (if needed)**

```bash
# Stop current deployment
docker-compose -f docker-compose.yml stop

# Restore from backup (see OPERATIONS_BACKUP_POSTGRES.md)
./scripts/backup_postgres.sh restore backups/prelaunch_backup_TIMESTAMP.sql

# Restart production
docker-compose -f docker-compose.yml up -d
```

## Load Testing

See: OPERATIONS_LOAD_TESTING.md

## Test Tenants

Staging environment includes demo tenants for testing:

```bash
# Create test tenant
docker-compose -f docker-compose.staging.yml exec backend python manage.py shell
>>> from apps.tenants.models import Tenant, Domain
>>> t = Tenant.objects.create(schema_name='test_acme', name='Test ACME Corp', slug='test-acme')
>>> Domain.objects.create(domain='test-acme.staging.local', tenant=t, is_primary=True)

# Access as tenant
# Frontend: http://test-acme.staging.local:5174
# API: http://test-acme.staging.local:8001/api/

# Create user in tenant
>>> from django.contrib.auth.models import User
>>> user = User.objects.create_user('testuser@acme.com', 'testuser@acme.com', 'password123')
```

## Cleanup

### Stop Staging

```bash
docker-compose -f docker-compose.staging.yml down
```

### Full Reset (WARNING: Deletes data)

```bash
docker-compose -f docker-compose.staging.yml down -v
rm -rf staging_* ~/.docker/volumes/staging*
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs backend
docker-compose -f docker-compose.staging.yml logs db

# Verify ports not in use
lsof -i :8001
lsof -i :5433
lsof -i :6380
```

### Migrations Failed

```bash
# Reset migrations (dangerous!)
docker-compose -f docker-compose.staging.yml exec backend \
  python manage.py migrate apps_core zero

# Reapply
docker-compose -f docker-compose.staging.yml exec backend \
  python manage.py migrate
```

### Database Connection Issues

```bash
# Test connection
docker-compose -f docker-compose.staging.yml exec db \
  psql -U postgres -d hrms_staging -c "SELECT 1;"

# Check running processes
docker-compose -f docker-compose.staging.yml exec db \
  psql -U postgres -d hrms_staging -c "SELECT pid, usename, application_name, state FROM pg_stat_activity;"
```

### Redis Connection Issues

```bash
# Test Redis
docker-compose -f docker-compose.staging.yml exec redis redis-cli ping
docker-compose -f docker-compose.staging.yml exec redis redis-cli INFO
```

## Monitoring Staging

### View Logs

```bash
# Backend
docker-compose -f docker-compose.staging.yml logs -f backend --tail=100

# Celery
docker-compose -f docker-compose.staging.yml logs -f celery --tail=100

# Database
docker-compose -f docker-compose.staging.yml logs -f db --tail=50

# All services
docker-compose -f docker-compose.staging.yml logs -f --tail=100
```

### Performance Metrics

```bash
# Database size
docker-compose -f docker-compose.staging.yml exec db \
  psql -U postgres -d hrms_staging -c "SELECT pg_size_pretty(pg_database_size('hrms_staging'));"

# Table sizes
docker-compose -f docker-compose.staging.yml exec db \
  psql -U postgres -d hrms_staging -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"

# Connections
docker-compose -f docker-compose.staging.yml exec db \
  psql -U postgres -d hrms_staging -c "SELECT count(*) FROM pg_stat_activity;"
```

## References

- Load Testing: See OPERATIONS_LOAD_TESTING.md
- Backups: See OPERATIONS_BACKUP_POSTGRES.md
- Monitoring: See OPERATIONS_MONITORING_ALERTING.md
