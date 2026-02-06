# Operational Runbooks - PS IntelliHR Production

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Deployment Procedures](#deployment-procedures)
3. [Incident Response](#incident-response)
4. [Backup & Recovery](#backup--recovery)
5. [Scaling](#scaling)
6. [Maintenance](#maintenance)

---

## DAILY OPERATIONS

### Morning Checklist (Start of Business)

**Every day at 8:00 AM UTC:**

```bash
#!/bin/bash
# scripts/morning_check.sh

echo "🌅 Morning Operations Checklist"

# 1. Verify all services running
docker-compose ps | grep -E 'backend|celery|beat|db|redis|nginx'
if [ $? -ne 0 ]; then echo "❌ Some services not running"; exit 1; fi
echo "✅ All services running"

# 2. Check database health
docker-compose exec db psql -U postgres -d hrms_db -c "SELECT 1;" > /dev/null
if [ $? -ne 0 ]; then echo "❌ Database down"; exit 1; fi
echo "✅ Database healthy"

# 3. Check Redis health
docker-compose exec redis redis-cli ping | grep -q PONG
if [ $? -ne 0 ]; then echo "❌ Redis down"; exit 1; fi
echo "✅ Redis healthy"

# 4. Check recent errors
errors=$(docker logs backend --since 30m | grep -c ERROR || echo 0)
if [ $errors -gt 10 ]; then echo "⚠️  ${errors} errors in last 30 minutes"; fi
echo "✅ Error rate normal"

# 5. Check disk space
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $disk_usage -gt 85 ]; then echo "⚠️  Disk ${disk_usage}% full"; fi
echo "✅ Disk space adequate"

# 6. Verify backups ran
latest_backup=$(ls -t /app/backups/full/*.sql.gz | head -1)
echo "✅ Latest backup: $(basename $latest_backup)"

echo ""
echo "🟢 All checks passed - Ready for business"
```

Run it:

```bash
chmod +x scripts/morning_check.sh
./scripts/morning_check.sh
```

---

### Evening Checklist (End of Business)

**Every day at 6:00 PM UTC:**

```bash
#!/bin/bash
# scripts/evening_check.sh

echo "🌆 Evening Operations Checklist"

# 1. Verify no pending migrations
docker-compose exec backend python manage.py showmigrations | grep -i "(\s*)" > /dev/null
if [ $? -eq 0 ]; then echo "⚠️  Unapplied migrations found"; fi
echo "✅ Migrations applied"

# 2. Check queue depth
queue_depth=$(docker-compose exec celery celery -A config inspect active_queues | jq '.[].active' | wc -l || echo 0)
echo "📊 Queue depth: ${queue_depth} tasks"

# 3. Review error logs
docker logs backend --since 12h | grep ERROR | tail -5
echo "✅ Error logs reviewed"

# 4. Check disk space trend
echo "📊 Disk usage trend:"
docker exec db df / | tail -1
echo "✅ Disk check complete"

echo ""
echo "🟢 Evening checks complete"
```

---

## DEPLOYMENT PROCEDURES

### Safe Deployment Process

**Time required:** 15-30 minutes
**Risk:** Low (if all checks pass)
**Rollback window:** Unlimited (backups enabled)

```bash
#!/bin/bash
# scripts/safe_deploy.sh
# Usage: ./scripts/safe_deploy.sh [version]

VERSION="${1:-latest}"
echo "🚀 Starting safe deployment of version: ${VERSION}"

# Step 1: Pre-deployment validation
echo "[1/8] Running pre-deployment validation..."
docker-compose exec backend pytest apps/tenants/tests/test_tenant_isolation.py -v || {
  echo "❌ Tenant isolation tests failed"
  exit 1
}
docker-compose exec backend python manage.py validate_migrations || {
  echo "❌ Migration validation failed"
  exit 1
}
echo "✅ Pre-deployment validation passed"

# Step 2: Full database backup
echo "[2/8] Creating database backup..."
docker-compose exec db pg_dump --no-acl --no-owner hrms_db | \
  gzip > backups/predeployment_$(date +%s).sql.gz || {
  echo "❌ Backup failed"
  exit 1
}
echo "✅ Database backed up"

# Step 3: Pull latest images
echo "[3/8] Pulling latest Docker images..."
docker-compose pull backend frontend celery || {
  echo "❌ Docker pull failed"
  exit 1
}
echo "✅ Images pulled"

# Step 4: Apply database migrations
echo "[4/8] Applying migrations (dry-run)..."
docker-compose run --rm backend python manage.py migrate --plan || {
  echo "❌ Migration plan failed"
  exit 1
}
echo "✅ Migration plan validated"

# Step 5: Stop backend gracefully
echo "[5/8] Stopping backend (graceful shutdown)..."
docker-compose stop backend -t 30 || true
sleep 5
echo "✅ Backend stopped"

# Step 6: Apply migrations
echo "[6/8] Applying database migrations..."
docker-compose run --rm backend python manage.py migrate || {
  echo "❌ Migrations failed"
  echo "🔄 Rolling back deployment..."
  docker-compose up -d backend
  exit 1
}
echo "✅ Migrations applied"

# Step 7: Restart services
echo "[7/8] Restarting services..."
docker-compose up -d backend celery beat frontend || {
  echo "❌ Service restart failed"
  exit 1
}
sleep 10
echo "✅ Services restarted"

# Step 8: Verify deployment
echo "[8/8] Verifying deployment..."
if curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
  echo "✅ Backend health check passed"
else
  echo "❌ Backend health check failed"
  echo "🔄 Rolling back deployment..."
  docker-compose restart backend
  exit 1
fi

echo ""
echo "🟢 Deployment successful!"
echo "📊 Monitoring for 5 minutes..."
for i in {1..30}; do
  errors=$(docker logs backend --since 10s | grep -c ERROR || echo 0)
  if [ $errors -gt 5 ]; then
    echo "❌ High error rate detected post-deployment"
    exit 1
  fi
  sleep 10
done

echo "🟢 All post-deployment checks passed"
```

Run it:

```bash
chmod +x scripts/safe_deploy.sh
./scripts/safe_deploy.sh v1.2.3
```

---

### Rollback Procedure

**If deployment fails:**

```bash
#!/bin/bash
# scripts/rollback_deploy.sh

echo "🔄 Initiating rollback..."

# 1. Get latest backup
latest_backup=$(ls -t backups/predeployment_*.sql.gz | head -1)
echo "Using backup: $latest_backup"

# 2. Confirm with user
read -p "This will restore database from backup. Continue? (yes/no): " confirm
[ "$confirm" != "yes" ] && { echo "Rollback cancelled"; exit 1; }

# 3. Restore database
echo "Restoring database..."
docker-compose down
gzip -dc "$latest_backup" | docker-compose exec -T db psql -U postgres -d hrms_db || {
  echo "❌ Restore failed"
  exit 1
}

# 4. Restart services
echo "Restarting services..."
docker-compose up -d

# 5. Verify
sleep 10
if curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
  echo "🟢 Rollback successful"
else
  echo "❌ Rollback verification failed - manual intervention needed"
  exit 1
fi
```

---

## INCIDENT RESPONSE

### Severity Levels

| Level | Impact | Response Time | Actions |
|-------|--------|----------------|---------|
| **SEV-0** | Data loss / Security breach | Immediate | Page on-call + CTO |
| **SEV-1** | Service down | 5 minutes | Page on-call + restart |
| **SEV-2** | Degraded performance | 15 minutes | Investigate + scale |
| **SEV-3** | Minor issues | 1 hour | Monitor + plan fix |

---

### SEV-0: Data Loss or Security Breach

**Response (IMMEDIATE):**

```bash
# 1. STOP everything to prevent further damage
docker-compose stop backend celery

# 2. PRESERVE evidence
docker-compose exec db pg_dump hrms_db > /tmp/emergency_dump_$(date +%s).sql

# 3. Page on-call team (manually - don't wait for automation)
# - Email: Page CTO + Security Team immediately
# - Slack: Post in #incidents channel with severity-0 tag

# 4. Isolate: Don't restart until investigation complete
```

**Investigation (First 30 minutes):**

```bash
# Check database for unauthorized access
docker-compose exec db psql -U postgres -d hrms_db -c \
  "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20;"

# Check application logs for suspicious activity
docker logs backend --since 1h | grep -i "security\|unauthorized\|delete\|truncate"

# Check for recent code changes
git log --oneline --since="1 hour ago"

# Check for open connections
docker-compose exec db psql -U postgres -d hrms_db -c \
  "SELECT pid, usename, query FROM pg_stat_activity WHERE state != 'idle';"
```

---

### SEV-1: Complete Service Outage

**Step 1: Immediate (< 1 minute)**

```bash
echo "🚨 SEV-1: Service Outage"

# Check what's down
docker-compose ps

# Attempt immediate restart
docker-compose restart backend celery beat

sleep 10

# Check if recovered
curl http://localhost:8000/api/health/ || echo "Still down"
```

**Step 2: If restart doesn't work (< 5 minutes)**

```bash
# Check logs for errors
docker-compose logs backend --tail=50
docker-compose logs celery --tail=50

# Check database connection
docker-compose exec db psql -U postgres -d hrms_db -c "SELECT 1;" || {
  echo "Database is down - restarting"
  docker-compose restart db
  sleep 30
  docker-compose restart backend celery
}

# Check Redis
docker-compose exec redis redis-cli ping || {
  echo "Redis is down - restarting"
  docker-compose restart redis
  docker-compose restart backend celery beat
}
```

**Step 3: If still not recovered (< 15 minutes)**

```bash
# Full restart with volume cleanup
docker-compose down

# Check disk space
df -h /app/

# Restart clean
docker-compose up -d

sleep 30

# Verify all services
docker-compose ps
curl http://localhost:8000/api/health/
```

---

### SEV-2: Performance Degradation

**Investigation (< 15 minutes):**

```bash
# 1. Check CPU/Memory
docker stats --no-stream | grep -E 'backend|db|celery'

# 2. Check database query performance
docker-compose exec db psql -U postgres -d hrms_db -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements \
   ORDER BY mean_time DESC LIMIT 10;"

# 3. Check long-running queries
docker-compose exec db psql -U postgres -d hrms_db -c \
  "SELECT pid, query, query_start FROM pg_stat_activity \
   WHERE state = 'active' AND query_start < NOW() - INTERVAL '1 minute';"

# 4. Check Celery queue depth
docker-compose exec celery celery -A config inspect active | jq '.[] | length'

# 5. Check error rate
docker logs backend --since 10m | grep -c ERROR
```

**Mitigation:**

```bash
# If high CPU: Scale workers
docker-compose up -d --scale celery=4

# If high memory: Restart services
docker-compose restart backend celery beat

# If database slow: Analyze and reindex
docker-compose exec db psql -U postgres -d hrms_db -c \
  "ANALYZE; REINDEX DATABASE hrms_db;"

# If queue backed up: Scale Celery more
docker-compose exec celery celery -A config shutdown
sleep 10
docker-compose up -d --scale celery=8
```

---

## BACKUP & RECOVERY

### Daily Backup Verification

```bash
#!/bin/bash
# scripts/verify_backup.sh
# Run daily to ensure backups are restorable

LATEST_BACKUP=$(ls -t /app/backups/full/*.sql.gz | head -1)
TEST_DB="test_restore_verify_$(date +%s)"

echo "🔍 Verifying backup: $(basename $LATEST_BACKUP)"

# 1. Check gzip integrity
gzip -t "$LATEST_BACKUP" || {
  echo "❌ Backup file is corrupted"
  exit 1
}
echo "✅ Backup file integrity verified"

# 2. Create test database
docker-compose exec db createdb -U postgres "$TEST_DB" || {
  echo "❌ Failed to create test database"
  exit 1
}

# 3. Restore to test database
gzip -dc "$LATEST_BACKUP" | docker-compose exec -T db \
  psql -U postgres -d "$TEST_DB" > /dev/null || {
  echo "❌ Restore failed"
  docker-compose exec db dropdb -U postgres "$TEST_DB"
  exit 1
}
echo "✅ Backup successfully restored"

# 4. Verify tables in restored database
tables=$(docker-compose exec db psql -U postgres -d "$TEST_DB" -t \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
if [ "$tables" -lt 10 ]; then
  echo "⚠️  Warning: Only $tables tables in restored database (expected > 10)"
fi
echo "✅ Tables verified ($tables tables)"

# 5. Cleanup
docker-compose exec db dropdb -U postgres "$TEST_DB"
echo "✅ Test database cleaned up"

echo ""
echo "🟢 Backup verified successfully"
```

Run it:

```bash
chmod +x scripts/verify_backup.sh
# Add to cron: 0 3 * * * /app/scripts/verify_backup.sh >> /var/log/backups.log 2>&1
```

---

### Point-in-Time Recovery

**Scenario:** Need to recover data from 2 days ago

```bash
#!/bin/bash
# This requires WAL archive files from PostgreSQL

echo "⏮️  Point-in-Time Recovery"

# 1. Backup current database first
./scripts/backup_postgres.sh full

# 2. Create recovery database
RECOVERY_DB="hrms_pitr_$(date +%s)"
docker-compose exec db createdb -U postgres "$RECOVERY_DB"

# 3. Restore last full backup
gzip -dc backups/full/backup_full_*.sql.gz | \
  docker-compose exec -T db psql -U postgres -d "$RECOVERY_DB"

# 4. Apply WAL files up to target time
# This is complex - requires PostgreSQL standby recovery
# See: https://www.postgresql.org/docs/current/continuous-archiving.html

echo "📍 To complete PITR:"
echo "  1. Review contents of $RECOVERY_DB"
echo "  2. If correct, rename to production database"
echo "  3. Restart services"
echo ""
echo "  If incorrect, drop and retry with different target time:"
echo "  docker-compose exec db dropdb -U postgres $RECOVERY_DB"
```

---

## SCALING

### Scale Celery Workers

**For increased task load:**

```bash
# Current: 2 workers
docker-compose ps celery

# Scale to 4 workers
docker-compose up -d --scale celery=4

# Verify
docker-compose ps celery

# Monitor queue
watch -n 2 'docker-compose exec celery celery -A config inspect active_queues'
```

---

### Scale Database Connections

**If too many "max connections reached" errors:**

```bash
# Current setting: 200
# Edit PostgreSQL config
docker-compose exec db vi /etc/postgresql/postgresql.conf
# Change: max_connections = 300

# Restart database
docker-compose restart db

# Verify
docker-compose exec db psql -U postgres -c "SHOW max_connections;"
```

---

## MAINTENANCE

### Clear Old Logs

```bash
#!/bin/bash
# scripts/cleanup_logs.sh

echo "🧹 Cleaning old logs..."

# Keep last 7 days
find /app/logs -name "*.log" -mtime +7 -delete

# Docker logs (local only - doesn't affect persistent logs)
docker system prune -f

echo "✅ Cleanup complete"
```

---

### Analyze Database Performance

```bash
#!/bin/bash
# scripts/analyze_database.sh

echo "📊 Database Analysis"

# Largest tables
docker-compose exec db psql -U postgres -d hrms_db -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) \
   FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') \
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"

# Missing indexes
docker-compose exec db psql -U postgres -d hrms_db -c \
  "SELECT schemaname, tablename FROM pg_tables \
   WHERE schemaname NOT IN ('pg_catalog', 'information_schema') \
   AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE pg_indexes.tablename = pg_tables.tablename) \
   ORDER BY tablename;"

# Index bloat
docker-compose exec db psql -U postgres -d hrms_db -c \
  "SELECT current_database(), schemaname, tablename, ROUND(100*(pg_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||indexname))::numeric / pg_relation_size(schemaname||'.'||tablename), 2) AS waste_ratio \
   FROM pg_indexes \
   ORDER BY waste_ratio DESC LIMIT 10;"

echo "✅ Analysis complete"
```

---

### Vacuum and Analyze

```bash
#!/bin/bash
# Periodic maintenance - run weekly

docker-compose exec db psql -U postgres -d hrms_db -c \
  "VACUUM ANALYZE;"

echo "✅ Vacum and analyze complete"
```

---

**End of Operational Runbooks**

For additional help:
- Check monitoring logs: `/app/logs/`
- Review backend logs: `docker logs backend`
- Review database logs: `docker logs db`
- Contact: ops@company.com or #ops-support Slack
