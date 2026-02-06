# 🚀 QUICK REFERENCE - Production Operations

**PS IntelliHR Multi-Tenant HRMS**  
**Version:** 1.0.0  
**Status:** Production Ready (8/10)

---

## 🏁 QUICK START

### First-Time Setup
```bash
# 1. Start services
docker-compose up -d

# Backend automatically:
# ✅ Waits for DB/Redis
# ✅ Applies migrations
# ✅ Creates public tenant
# ✅ Creates superuser
# ✅ Runs diagnostics
# ✅ Starts server
```

### Access Points
- **Backend API:** http://localhost:8000
- **Admin Panel:** http://localhost:8000/admin/
- **API Docs:** http://localhost:8000/api/docs/
- **Health Check:** http://localhost:8000/api/health/
- **Frontend:** http://localhost:3000

### Default Credentials
- **Email:** admin@psintellhr.com
- **Password:** admin123
- ⚠️ **CHANGE IMMEDIATELY IN PRODUCTION**

---

## 🔍 HEALTH CHECKS

### Quick Health Check
```bash
curl http://localhost:8000/api/health/
# Expected: {"status": "ok"}
```

### Comprehensive Diagnostics
```bash
docker-compose exec backend python manage.py diagnose
```

**Output:**
```
→ Checking database connection... ✓
→ Checking migrations... ✓
→ Checking public tenant... ✓
→ Checking localhost domain... ✓
→ Checking superuser... ✓
→ Checking Redis... ✓

✓ DIAGNOSTICS PASSED: 6 checks passed, 0 warnings
```

---

## 🛠️ COMMON TASKS

### Create New Tenant
```bash
docker-compose exec backend python manage.py shell
```
```python
from apps.tenants.models import Tenant, Domain

tenant = Tenant.objects.create(
    schema_name='acme_corp',
    name='Acme Corporation',
    slug='acme',
    is_active=True,
    subscription_status='active',
    max_users=100
)

Domain.objects.create(
    domain='acme.yourdomain.com',
    tenant=tenant,
    is_primary=True
)
```

### Run Migrations
```bash
# Check for unapplied migrations
docker-compose exec backend python manage.py migrate --check

# Apply migrations
docker-compose exec backend python manage.py migrate
```

### Create Superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

### Reset Public Tenant (if corrupted)
```bash
docker-compose exec backend python manage.py ensure_public_tenant --create-superuser
```

---

## 🧪 TESTING

### Run All Tests
```bash
docker-compose exec backend pytest -v
```

### CRITICAL: Tenant Isolation Tests
```bash
docker-compose exec backend pytest apps/tenants/tests/test_tenant_isolation.py -v

# ⚠️ MUST PASS before production deploy
# Tests verify:
# ✅ Tenant A cannot see Tenant B data
# ✅ JWT tokens validated per tenant
# ✅ Cross-tenant access blocked
```

### Validate Migrations
```bash
docker-compose exec backend python manage.py validate_migrations
```

---

## 📊 MONITORING

### View Logs
```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Celery worker
docker-compose logs -f celery
```

### Check Container Status
```bash
docker-compose ps

# Expected output:
# backend    Up (healthy)
# db         Up (healthy)
# redis      Up (healthy)
# celery     Up
# frontend   Up
```

### Database Queries
```bash
# Connect to database
docker-compose exec db psql -U hrms_admin ps_intellihr

# List schemas (tenants)
\dn

# Switch to tenant schema
SET search_path TO tenant_schema_name;

# List tables
\dt
```

---

## 🚨 TROUBLESHOOTING

### Issue: Backend won't start

**Check logs:**
```bash
docker-compose logs backend
```

**Common causes:**
1. Database not ready → Wait 30s, check `docker-compose ps`
2. Redis not ready → Wait 30s, check `docker-compose ps`
3. Migration failure → Check logs for error
4. Public tenant missing → Run `ensure_public_tenant`

**Fix:**
```bash
# Restart services
docker-compose restart backend

# Or full rebuild
docker-compose down
docker-compose up -d --build
```

---

### Issue: Health check returns 404

**Cause:** Public tenant not found

**Fix:**
```bash
docker-compose exec backend python manage.py ensure_public_tenant
docker-compose restart backend
```

---

### Issue: "Tenant not found" errors

**Check tenant exists:**
```bash
docker-compose exec backend python manage.py shell
```
```python
from apps.tenants.models import Tenant, Domain
Tenant.objects.all()
Domain.objects.all()
```

**Create tenant if missing** (see "Create New Tenant" above)

---

### Issue: JWT "tenant mismatch" errors

**Cause:** User trying to use token from different tenant

**Expected behavior:** This is correct! Returns 403 Forbidden

**Fix:** User must login to correct tenant

---

### Issue: Celery tasks not running

**Check worker status:**
```bash
docker-compose ps celery
docker-compose logs celery
```

**Restart worker:**
```bash
docker-compose restart celery
```

---

## 💾 BACKUP & RESTORE

### Manual Backup
```bash
# Database backup
docker-compose exec db pg_dump -U hrms_admin ps_intellihr | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup
ls -lh backup_*.sql.gz
```

### Restore from Backup
```bash
# Stop backend
docker-compose stop backend celery celery-beat

# Restore database
gunzip -c backup_20260126_120000.sql.gz | docker-compose exec -T db psql -U hrms_admin ps_intellihr

# Restart services
docker-compose start backend celery celery-beat
```

---

## 🔐 SECURITY

### Change Default Password
```bash
docker-compose exec backend python manage.py shell
```
```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(email='admin@psintellhr.com')
user.set_password('new_secure_password_here')
user.save()
```

### Verify Tenant Isolation
```bash
# Run security tests
docker-compose exec backend pytest apps/tenants/tests/test_tenant_isolation.py -v

# Expected: All tests PASS
```

---

## 📈 PERFORMANCE

### Check Database Connections
```bash
docker-compose exec db psql -U hrms_admin ps_intellihr -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'ps_intellihr';"
```

### Check Redis Memory
```bash
docker-compose exec redis redis-cli INFO memory
```

### Check Backend Memory
```bash
docker stats --no-stream ps_intellihr_backend
```

---

## 🆘 EMERGENCY CONTACTS

**Critical Issues (SEV-1):**
- Tenant data leak
- Database corruption
- Complete service outage

**Action:** IMMEDIATE escalation to:
- On-call Engineer: [Contact]
- Security Team: [Contact]
- CTO: [Contact]

**Non-Critical Issues:**
- Create GitHub issue
- Slack: #hrms-support

---

## 📚 DOCUMENTATION

- **Full Documentation:** `/docs/`
- **API Documentation:** http://localhost:8000/api/docs/
- **Postmortem:** [POSTMORTEM.md](POSTMORTEM.md)
- **Production Hardening:** [PRODUCTION_HARDENING.md](PRODUCTION_HARDENING.md)
- **Architecture:** [README.md](README.md)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

**Before each deployment:**
- [ ] All CI/CD checks passing
- [ ] Tenant isolation tests passing
- [ ] Migrations validated
- [ ] Security scan clean
- [ ] Backup created
- [ ] Rollback plan ready
- [ ] On-call engineer assigned

**Post-deployment (first 24h):**
- [ ] Health checks passing
- [ ] No error spikes in logs
- [ ] Tenant isolation working
- [ ] Celery tasks executing
- [ ] Performance metrics normal

---

**Last Updated:** January 26, 2026  
**Version:** 1.0.0  
**Maintained by:** DevOps Team
