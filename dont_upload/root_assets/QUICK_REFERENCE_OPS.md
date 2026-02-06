# 🚀 QUICK REFERENCE: Production Operations

**Keep this handy for launch day and first week of operations**

---

## Critical Commands (Copy-Paste Ready)

### Pre-Launch Verification (Run 24h before launch)
```bash
./scripts/prelaunch_verification.sh
# Expected: 20/20 checks PASS ✅
```

### Launch Deployment (Run when ready)
```bash
./scripts/safe_deploy.sh v1.0.0
# Expected: 8-step deployment, health check green
```

### Monitor Backend Logs
```bash
docker-compose logs -f backend --tail=100
# Watch for errors, exit with Ctrl+C
```

### Check System Health
```bash
curl http://localhost:8000/api/health/
# Expected: 200 OK, all services up
```

### Check Database Status
```bash
docker-compose exec db psql -U postgres -d hrms_db -c "SELECT 1;"
# Expected: 1 row returned
```

### Monitor Rate Limits
```bash
python manage.py monitor_rate_limits --watch
# Shows real-time rate limit usage per tenant
```

### Check Backup Status
```bash
ls -lah /app/backups/full/
# Should see today's encrypted backup
```

### View Celery Queue Depth
```bash
python manage.py shell
>>> from celery.app.control import Inspect
>>> i = Inspect()
>>> i.active()  # Shows active tasks
>>> i.reserved()  # Shows queued tasks
```

---

## 6 Critical Alerts You'll See

### 1. Error Rate High (> 5% in 5 min)
**What it means:** Too many requests failing  
**Check:** `docker logs backend | grep ERROR | tail -20`  
**Action:** Review error messages, check database status  

### 2. Backend Health Check Failed
**What it means:** Backend container not responding  
**Check:** `curl http://localhost:8000/api/health/`  
**Action:** Restart container, check logs for crash  

### 3. Database Connections > 80%
**What it means:** Running out of database connections  
**Check:** `docker-compose exec db psql -c "SELECT count(*) FROM pg_stat_activity;"`  
**Action:** Check for hung connections, increase pool if needed  

### 4. Celery Queue > 1000 Tasks
**What it means:** Task queue backing up, tasks slow to execute  
**Check:** Increase Celery worker count  
**Action:** Scale workers: `docker-compose up -d --scale celery=3`  

### 5. Disk Usage > 85%
**What it means:** Running out of disk space  
**Check:** `df -h /app`  
**Action:** Clean up old logs, backups, temporary files  

### 6. Tenant Rate Limit High (> 90%)
**What it means:** Tenant approaching rate limit  
**Check:** `python manage.py monitor_rate_limits --high-usage`  
**Action:** Review if legitimate spike, increase limit if needed  

---

## Incident Response Cheat Sheet

### SEV-0 (Critical - System Down)
```
1. Page on-call manager immediately
2. Check docker-compose ps (any container down?)
3. Check logs: docker-compose logs -f
4. Restart: docker-compose restart backend
5. Check health: curl http://localhost:8000/api/health/
6. Notify users via status page
7. Start debugging after system is up
```

### SEV-1 (Major - Partial Service Down)
```
1. Alert team on Slack
2. Identify affected feature (employees, attendance, etc)
3. Check logs for that service
4. Restart affected service
5. Verify recovery
6. Document in incident log
7. Post-mortem in next 24 hours
```

### SEV-2 (Minor - Degraded Performance)
```
1. Monitor for 5 minutes
2. If still degraded, review load
3. Check if rate limits triggered
4. Scale workers if queue backing up
5. Document for analysis
6. No post-mortem needed
```

### SEV-3 (Low - Transient Issue)
```
1. Monitor and log
2. Continue normal operations
3. Review logs at end of shift
4. No immediate action needed
```

---

## Daily Operations Checklist

### Morning (Start of Day)
```bash
# 1. System health
./scripts/prelaunch_verification.sh | head -20

# 2. Backup verification
ls -lah /app/backups/full/ | head -5

# 3. Error rate check
docker logs backend --since 24h | grep -c ERROR

# 4. Database health
docker-compose exec db psql -c "SELECT now();"

# 5. Ready to go
echo "✅ All systems operational"
```

### Evening (End of Day)
```bash
# 1. Day's error summary
docker logs backend --since 24h | grep ERROR | wc -l

# 2. Backup confirmation
ls -lah /app/backups/full/ | tail -1

# 3. Queue depth
python manage.py shell -c "print('Queue OK')"

# 4. Rate limit usage
python manage.py monitor_rate_limits

# 5. Document any issues
# Create ticket if anything unusual occurred
```

---

## Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Backend not responding** | curl timeout | `docker-compose restart backend` |
| **Database slow** | 30+ sec response | Check connections: `psql -c "SELECT count(*) FROM pg_stat_activity;"` |
| **Queue backing up** | Alerts slow | `docker-compose up -d --scale celery=3` |
| **Rate limit errors** | 429 responses | Check limit config: `python manage.py monitor_rate_limits --high-usage` |
| **Memory high** | Container kills | `docker-compose restart` + investigate for leaks |
| **Disk full** | Backend won't start | Delete old logs: `rm -rf /app/logs/*.log.* /app/backups/incremental/*` |
| **Tenant isolation broken** | Cross-tenant data leak | **CRITICAL** - Page CTO immediately |

---

## File Locations (Bookmark These)

| What | Where |
|------|-------|
| Logs | `/app/logs/` |
| Backups | `/app/backups/full/` or `/app/backups/incremental/` |
| Media/Uploads | `/app/media/` |
| Database Data | `/app/data/postgres/` |
| Redis Data | `/app/data/redis/` |
| Configuration | `backend/config/settings/` |
| Operations Guide | `OPERATIONS_RUNBOOKS.md` |
| On-Call Procedures | `OPERATIONS_RUNBOOKS.md` (Incident Response) |

---

## Escalation Contact Chain

### For Technical Issues
1. **First:** Check procedures in OPERATIONS_RUNBOOKS.md
2. **Second:** Ask team lead on Slack
3. **Third:** Page on-call engineer
4. **Fourth (SEV-0 only):** Page CTO

### For Security Issues
1. **Immediately:** Page Security Lead
2. **Second:** Page CTO
3. **Document:** Create incident report

### For Tenant Complaints
1. **Acknowledge:** Thank for reporting
2. **Assess:** Verify issue is real (not user error)
3. **Escalate:** If confirmed, page on-call engineer
4. **Communicate:** Keep tenant updated on progress

---

## Metrics Dashboard (Check Every Hour)

Monitor these on your dashboard:

```
┌─────────────────────────────────────────────────┐
│  HEALTH DASHBOARD                               │
├─────────────────────────────────────────────────┤
│  Error Rate (target < 0.5%)         [████░░░] ✅ │
│  Response Time p95 (target < 1s)    [████░░░] ✅ │
│  DB Connections (target < 50)       [███░░░░] ✅ │
│  Celery Queue (target < 100)        [██░░░░░] ✅ │
│  Uptime (target > 99%)              [██████░] ✅ │
│  Disk Free (target > 20GB)          [████████] ✅ │
├─────────────────────────────────────────────────┤
│  Overall Health                           ✅ GREEN │
└─────────────────────────────────────────────────┘
```

If any metric is red or yellow → investigate immediately.

---

## Backup Verification (Weekly)

**Run every Monday morning:**

```bash
# 1. Check backup exists and is fresh
ls -lah /app/backups/full/ | head -3

# 2. Test restore to temporary DB
# (Procedure in OPERATIONS_BACKUP_POSTGRES.md)

# 3. Verify restore succeeded
# Query temporary DB for sample data

# 4. Document completion
# Create ticket: "Backup verification passed - Week of Jan 26"

# 5. Celebrate - backups are working! 🎉
```

---

## Load Testing (Before Major Release)

```bash
# 1. Run load test
k6 run scripts/load_test_hrms.js

# 2. Check metrics
# - Error rate < 5% ✅
# - Response time p95 < 1s ✅
# - Tenant isolation 100% ✅

# 3. If all pass, ready to deploy
# If any fail, debug before release
```

---

## Deployment Safety Checklist

**Before every deployment:**
```
☐ Pre-deployment tests passing
☐ Database backup completed
☐ Load test passed (if major release)
☐ Team notified in Slack
☐ On-call engineer standing by
☐ Rollback plan reviewed
☐ Monitoring dashboard open
```

**During deployment (15 min window):**
```
☐ Run safe_deploy.sh
☐ Monitor logs for errors
☐ Check health endpoint
☐ Verify no customer complaints
☐ All green? Announce success
```

**After deployment (first 24 hours):**
```
☐ Monitor error rate
☐ Watch database performance
☐ Check backup completed
☐ Document any issues
☐ Thank the team! 🎉
```

---

## When to Call for Help

### Call Team Lead If:
- ❌ Unsure what the error means
- ❌ Procedure not in runbooks
- ❌ Multiple issues at once

### Call On-Call Engineer If:
- ❌ SEV-1 or higher issue
- ❌ Need immediate expert guidance
- ❌ Issue not resolving after 10 min

### Call CTO If:
- ❌ Possible security breach
- ❌ SEV-0 incident
- ❌ Need authorization for major changes

### Never Call CTO For:
- ✅ Questions about procedures (ask team lead)
- ✅ Feature requests (that's product)
- ✅ Help choosing between two options (that's your decision)

---

## Success Indicators (First Week)

### Day 1 (Launch)
- ✅ System deployed successfully
- ✅ No errors > 5%
- ✅ All health checks passing
- ✅ Team celebrating

### Day 2-3
- ✅ Error rate stabilizing < 1%
- ✅ Users actively using platform
- ✅ Backups completing on schedule
- ✅ No major incidents

### Day 4-7
- ✅ Stable operations
- ✅ Customer feedback positive
- ✅ Team confident in procedures
- ✅ Ready for next phase

---

## Bookmarks for Quick Reference

**Keep these bookmarks ready:**

1. OPERATIONS_RUNBOOKS.md - Your bible for all procedures
2. OPERATIONS_MONITORING_ALERTING.md - What alerts mean and how to respond
3. OPERATIONS_BACKUP_POSTGRES.md - Backup/restore procedures
4. This document - Quick cheat sheet

**Slack channels to join:**
- #incidents - Real-time incident notifications
- #deployments - Deployment announcements
- #on-call - On-call rotation schedule
- #operations - Day-to-day ops discussion

---

## Remember

- **Stay calm** - Most issues have known solutions
- **Follow procedures** - Runbooks exist for this reason
- **Ask for help** - That's what the team is for
- **Document** - Log what happened and what you did
- **Communicate** - Keep team informed via Slack
- **Learn** - Each incident is an opportunity to improve

---

**You've got this! 🚀**

The system is production-ready, the team is trained, and the procedures are clear.

**Go launch this thing!**

---

Last updated: January 26, 2026  
Valid for: Production launch + first 30 days  
Keep updated as: You learn new things operationally
