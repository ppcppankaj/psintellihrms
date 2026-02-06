# Monitoring & Alerting Guide

## Minimum Viable Observability (MVO)

Simple, actionable alerts without complex dashboards. Focus on **what can break** and **what costs money**.

## Core Metrics

### 1. Error Rate Alert

**Why it matters:** Detects service degradation before customers notice

```bash
# Threshold: Error rate > 5% in 5-minute window
# Action: Page on-call engineer
# Check: Application logs, recent deployments

# Manual check:
docker-compose logs backend --tail=200 | grep ERROR | wc -l
```

**Alert Signal:**
```
🚨 ERROR RATE SPIKE
  - Current: 8.5% (threshold: 5%)
  - Duration: 5 minutes
  - Sample: "ConnectionError: connect to database"
  - Action: Check database connection, review recent deployment
```

---

### 2. Health Check Alert

**Why it matters:** Detects service outages immediately

```bash
# Endpoint: /api/health/
# Expected: 200 OK
# Interval: Every 10 seconds
# Threshold: 3 consecutive failures = alert
```

**Alert Signal:**
```
🚨 BACKEND UNREACHABLE
  - Endpoint: http://backend:8000/api/health/
  - Status: 503 Service Unavailable
  - Duration: 30 seconds
  - Action: Check backend logs, restart if needed
```

---

### 3. Database Connection Alert

**Why it matters:** Detects database exhaustion before requests fail

```bash
# Metric: Active connections / max connections
# Threshold: > 80% of max
# Interval: Every 30 seconds

# Manual check:
docker-compose exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

**Alert Signal:**
```
⚠️  DATABASE CONNECTIONS HIGH
  - Active: 85/100 (85%)
  - Threshold: 80
  - Duration: 2 minutes
  - Action: Kill idle connections, check for long-running queries
```

---

### 4. Celery Queue Depth Alert

**Why it matters:** Detects task processing backlog

```bash
# Metric: Pending tasks in queue
# Threshold: > 1000 tasks
# Interval: Every 60 seconds
```

**Alert Signal:**
```
⚠️  CELERY QUEUE BACKLOG
  - Pending: 2,500 tasks
  - Threshold: 1000
  - Duration: 5 minutes
  - Workers: 2 (should scale up)
  - Action: Scale celery workers, check for slow tasks
```

---

### 5. Disk Space Alert

**Why it matters:** Detects storage exhaustion

```bash
# Metric: Used disk space %
# Threshold: > 85%
# Interval: Every 5 minutes

# Manual check:
df -h | grep -E 'postgres|backups|media'
```

**Alert Signal:**
```
⚠️  DISK SPACE LOW
  - Used: 87% (threshold: 85%)
  - Available: 13 GB
  - Path: /app/data/
  - Action: Delete old files, expand volume
```

---

### 6. Rate Limit Abuse Alert

**Why it matters:** Detects individual tenants consuming excessive resources

```bash
# Metric: Any tenant > 90% of rate limit
# Threshold: Alert on high usage
# Interval: Every minute
```

**Alert Signal:**
```
⚠️  TENANT RATE LIMIT WARNING
  - Tenant: acme-corp
  - Usage: 950/1000 requests/minute (95%)
  - Threshold: 90%
  - Action: Contact tenant, check for broken integrations
```

---

## Simple Implementation Options

### Option 1: Shell Script + Cron (Simplest)

```bash
#!/bin/bash
# save as scripts/simple_monitoring.sh

check_backend_health() {
    if ! curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
        send_alert "critical" "Backend health check failed"
        return 1
    fi
}

check_error_rate() {
    # Count errors in last 5 minutes
    errors=$(docker logs backend --since 5m | grep -c ERROR || echo 0)
    total=$(docker logs backend --since 5m | wc -l)
    
    if [ $total -gt 0 ]; then
        rate=$(( (errors * 100) / total ))
        if [ $rate -gt 5 ]; then
            send_alert "warning" "Error rate ${rate}%"
        fi
    fi
}

check_db_connections() {
    connections=$(docker exec db psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" | xargs)
    if [ $connections -gt 80 ]; then
        send_alert "warning" "Database connections: ${connections}/100"
    fi
}

send_alert() {
    severity=$1
    message=$2
    
    # Send to Slack
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"[$severity] $message\"}" || true
    
    # Or send email
    echo "$message" | mail -s "Alert: $severity" "$ALERT_EMAIL" || true
}

# Run all checks
check_backend_health
check_error_rate
check_db_connections

echo "Monitoring checks complete"
```

Schedule with cron:

```bash
# Run every 5 minutes
*/5 * * * * /app/scripts/simple_monitoring.sh >> /var/log/monitoring.log 2>&1
```

---

### Option 2: Python Script (Recommended)

```python
# scripts/monitor_system.py

import requests
import psycopg2
import redis
from datetime import datetime, timedelta
from django.core.management import call_command
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SystemMonitor:
    def __init__(self, slack_webhook=None, email=None):
        self.slack_webhook = slack_webhook
        self.email = email
        self.alerts = []
    
    def check_all(self):
        """Run all monitoring checks."""
        self.check_health()
        self.check_database()
        self.check_redis()
        self.check_error_rate()
        self.check_rate_limits()
        
        if self.alerts:
            self.send_alerts()
    
    def check_health(self):
        """Check backend health endpoint."""
        try:
            resp = requests.get('http://localhost:8000/api/health/', timeout=5)
            if resp.status_code != 200:
                self.alerts.append({
                    'severity': 'critical',
                    'message': f'Backend health: {resp.status_code}',
                })
        except Exception as e:
            self.alerts.append({
                'severity': 'critical',
                'message': f'Backend unreachable: {str(e)}',
            })
    
    def check_database(self):
        """Check database connections."""
        try:
            conn = psycopg2.connect('dbname=hrms_db user=postgres')
            cursor = conn.cursor()
            cursor.execute("SELECT count(*) FROM pg_stat_activity;")
            count = cursor.fetchone()[0]
            conn.close()
            
            if count > 80:
                self.alerts.append({
                    'severity': 'warning',
                    'message': f'Database connections high: {count}/100',
                })
        except Exception as e:
            self.alerts.append({
                'severity': 'critical',
                'message': f'Database check failed: {str(e)}',
            })
    
    def check_redis(self):
        """Check Redis connectivity."""
        try:
            r = redis.Redis(host='localhost', port=6379)
            r.ping()
        except Exception as e:
            self.alerts.append({
                'severity': 'warning',
                'message': f'Redis unreachable: {str(e)}',
            })
    
    def check_error_rate(self):
        """Check error rate from logs."""
        # This would parse application logs
        pass
    
    def check_rate_limits(self):
        """Check rate limit usage."""
        # This would call monitor_rate_limits.py
        pass
    
    def send_alerts(self):
        """Send alerts via Slack or email."""
        for alert in self.alerts:
            logger.warning(f"[{alert['severity']}] {alert['message']}")
            
            if self.slack_webhook:
                self._send_slack(alert)
            if self.email:
                self._send_email(alert)
    
    def _send_slack(self, alert):
        """Send alert to Slack."""
        requests.post(self.slack_webhook, json={
            'text': f"[{alert['severity'].upper()}] {alert['message']}",
        })
    
    def _send_email(self, alert):
        """Send alert via email."""
        import subprocess
        subprocess.run([
            'mail',
            '-s', f"Alert: {alert['severity']}",
            self.email,
        ], input=alert['message'].encode())

if __name__ == '__main__':
    import os
    monitor = SystemMonitor(
        slack_webhook=os.getenv('SLACK_WEBHOOK'),
        email=os.getenv('ALERT_EMAIL'),
    )
    monitor.check_all()
```

Run via cron:

```bash
*/5 * * * * python /app/scripts/monitor_system.py >> /var/log/monitoring.log 2>&1
```

---

### Option 3: Prometheus + AlertManager (Enterprise)

For organizations wanting a proper monitoring stack:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    metrics_path: '/metrics/'
    static_configs:
      - targets: ['localhost:8000']
  
  - job_name: 'database'
    static_configs:
      - targets: ['localhost:5432']
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: localhost:9187  # postgres_exporter

alerts:
  - alert: HighErrorRate
    expr: rate(django_http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    annotations:
      summary: "High error rate detected"
  
  - alert: HighDatabaseConnections
    expr: pg_stat_activity_count > 80
    for: 2m
    annotations:
      summary: "Database connection limit approaching"
```

---

## Configuration

### Environment Variables

```bash
# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#ops-alerts

# Email Integration
ALERT_EMAIL=ops@company.com
ALERT_EMAIL_SMTP=smtp.gmail.com
ALERT_EMAIL_FROM=alerts@psintellhr.com

# Alert Thresholds
ERROR_RATE_THRESHOLD=5  # percent
DB_CONNECTION_THRESHOLD=80  # percent
DISK_SPACE_THRESHOLD=85  # percent
QUEUE_DEPTH_THRESHOLD=1000  # tasks
```

Load in `.env`:

```bash
export $(cat .env | xargs)
docker-compose exec backend python scripts/monitor_system.py
```

---

## Operational Playbooks

### Alert: Backend Unreachable

**Detection:**
```
🚨 CRITICAL: Backend health check failed
```

**Diagnosis:**
```bash
# 1. Check if container is running
docker ps | grep backend

# 2. Check logs
docker logs backend --tail=50

# 3. Check port
netstat -tuln | grep 8000

# 4. Test connection
curl http://localhost:8000/api/health/ -v
```

**Resolution:**
```bash
# Restart container
docker-compose restart backend

# If restart fails, check database
docker exec db psql -U postgres -d hrms_db -c "SELECT 1;"

# If database is down, restart everything
docker-compose restart db backend
```

---

### Alert: Error Rate > 5%

**Detection:**
```
⚠️  ERROR RATE SPIKE: 8.5% (threshold: 5%)
```

**Diagnosis:**
```bash
# 1. Check recent errors
docker logs backend --since 10m | grep ERROR

# 2. Check database errors
docker logs backend --since 10m | grep -i "database\|connection"

# 3. Check Celery errors
docker logs celery --since 10m | grep ERROR

# 4. Check for recent deployment
git log --oneline | head
```

**Resolution:**
```bash
# If recent deployment caused it:
docker-compose down
git revert HEAD
docker-compose up -d

# If database issue:
docker-compose restart db

# If temporary spike:
Monitor error rate to confirm it's resolving
```

---

### Alert: Database Connections > 80%

**Detection:**
```
⚠️  DATABASE CONNECTIONS: 85/100 (85%)
```

**Diagnosis:**
```bash
# 1. List active connections
docker exec db psql -U postgres -d hrms_db -c \
  "SELECT pid, usename, application_name, state, query FROM pg_stat_activity LIMIT 20;"

# 2. Find long-running queries
docker exec db psql -U postgres -d hrms_db -c \
  "SELECT pid, query, query_start FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start;"

# 3. Check pool exhaustion
docker exec db psql -U postgres -d hrms_db -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

**Resolution:**
```bash
# Kill idle connections
docker exec db psql -U postgres -d hrms_db -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"

# If that doesn't help, increase pool size in settings
# DATABASES['default']['CONN_MAX_AGE'] = 600

# Restart backend to apply changes
docker-compose restart backend
```

---

### Alert: Celery Queue Backlog > 1000

**Detection:**
```
⚠️  CELERY QUEUE BACKLOG: 2500 tasks
```

**Diagnosis:**
```bash
# 1. Check queue depth
docker-compose exec celery celery -A config inspect active_queues

# 2. Check worker status
docker-compose exec celery celery -A config inspect active

# 3. Check failed tasks
docker-compose exec celery celery -A config inspect failed
```

**Resolution:**
```bash
# Scale celery workers
docker-compose up -d --scale celery=4  # Increase from 2 to 4 workers

# Or restart workers if stuck
docker-compose restart celery beat
```

---

## Dashboard Template (Optional)

For simple visualization, use Grafana or metabase:

**Key Panels:**
1. Error Rate (5-min window)
2. Active Database Connections
3. Request Response Time (p95)
4. Celery Queue Depth
5. Disk Usage
6. CPU Usage
7. Memory Usage

---

## Testing Your Alerts

### Simulate Backend Failure

```bash
docker-compose stop backend
# Verify alert fires within 30 seconds
docker-compose start backend
```

### Simulate High Error Rate

```bash
# Temporarily break a view to cause errors
docker-compose exec backend python manage.py shell
>>> import random
>>> random.seed(1)
# Then make API requests
# Verify alert fires
```

### Simulate Database Issues

```bash
docker-compose pause db
# Verify error rate alert and database alert
docker-compose unpause db
```

---

## Go-Live Checklist

Before production:

- [ ] Slack webhook configured and tested
- [ ] Email alerts configured and tested
- [ ] Cron job running every 5 minutes
- [ ] On-call engineer receives alerts
- [ ] Playbooks printed and available
- [ ] Database backups alerting enabled
- [ ] Rate limit monitoring active

---

## References

- Slack API: https://api.slack.com/messaging/webhooks
- Prometheus: https://prometheus.io/
- Grafana: https://grafana.com/
- Django Logging: https://docs.djangoproject.com/en/stable/topics/logging/
