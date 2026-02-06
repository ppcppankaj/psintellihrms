# PostgreSQL Backup Configuration for Multi-Tenant HRMS

## Overview
This configuration sets up automated backups with point-in-time recovery (PITR) for PostgreSQL supporting multi-schema tenants.

## Backup Strategy

### Strategy: 3-2-1 Backup Rule
```
3 copies of data
2 different media types (local disk + S3)
1 off-site location (S3)
```

### Backup Schedule

| Backup Type | Frequency | Retention | Purpose |
|------------|-----------|-----------|---------|
| **Full** | Weekly (Sunday 2 AM UTC) | 30 days | Complete database snapshot |
| **Incremental (WAL)** | Continuous | 14 days | Point-in-time recovery capability |
| **Restore Test** | Weekly (Monday 3 AM UTC) | Metadata | Verify backup validity |

## PostgreSQL Configuration

Add to `postgresql.conf` for WAL archiving:

```ini
# Enable replication to support WAL archiving
wal_level = replica

# Enable archiving
archive_mode = on
archive_command = 'test ! -f /app/backups/wal_archive/%f && cp %p /app/backups/wal_archive/%f'
archive_timeout = 300

# Checkpoints for recovery
max_wal_senders = 3
wal_keep_size = 1GB

# Logging for monitoring
log_statement = 'mod'
log_min_duration_statement = 5000  # Log queries > 5 seconds
```

## Implementation

### Directory Structure

```
/app/backups/
├── full/                      # Weekly full backups
│   ├── backup_full_20260126_020000.sql.gz
│   ├── backup_full_20260119_020000.sql.gz
│   └── ...
├── incremental/               # WAL files (managed automatically)
│   ├── 000000010000000000000001
│   ├── 000000010000000000000002
│   └── ...
├── wal_archive/               # Active WAL archiving location
├── logs/                       # Backup logs and manifest
│   ├── backup.log
│   └── backup_manifest.log
└── restore_tests/             # Test restore results
    ├── test_restore_1704729600.log
    └── ...
```

### Automated Scheduling

#### Option 1: Docker Compose Service (Recommended)

```yaml
backup-scheduler:
  image: mcuadros/ofelia:latest
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ./scripts:/scripts:ro
  command: daemon --docker
  
# Add to backend service
backend:
  labels:
    ofelia.enabled: "true"
    # Full backup: every Sunday at 2 AM
    ofelia.job-exec.backup-full.schedule: "0 2 * * 0"
    ofelia.job-exec.backup-full.command: "bash /app/scripts/backup_postgres.sh full"
    
    # Restore test: every Monday at 3 AM
    ofelia.job-exec.backup-test.schedule: "0 3 * * 1"
    ofelia.job-exec.backup-test.command: "bash /app/scripts/backup_postgres.sh verify /app/backups/full/latest.sql.gz"
```

#### Option 2: Kubernetes CronJob (Enterprise)

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup-full
spec:
  schedule: "0 2 * * 0"  # Sunday 2 AM UTC
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16
            command: ["bash", "/scripts/backup_postgres.sh", "full"]
            env:
            - name: POSTGRES_HOST
              value: "postgres"
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
          restartPolicy: OnFailure
```

#### Option 3: Cron + Shell Script (Simple)

```bash
# Add to crontab
0 2 * * 0 source /app/.env && /app/scripts/backup_postgres.sh full >> /app/backups/logs/cron.log 2>&1
0 3 * * 1 source /app/.env && /app/scripts/backup_postgres.sh verify /app/backups/full/latest.sql.gz >> /app/backups/logs/cron.log 2>&1
```

## Environment Variables

```bash
# PostgreSQL Connection
POSTGRES_HOST=postgres.example.com
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=hrms_db

# Backup Configuration
BACKUP_DIR=/app/backups
RETENTION_DAYS=30
ENCRYPTION_KEY=<secure_encryption_key>

# S3 Configuration (Optional)
S3_BUCKET=company-backups
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=<aws_access_key>
AWS_SECRET_ACCESS_KEY=<aws_secret_key>

# Notification (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=ops@company.com
```

## Docker Compose Integration

```yaml
version: '3.8'

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres.conf:/etc/postgresql/postgresql.conf
      - ./backups:/app/backups
    ports:
      - "5432:5432"

  backend:
    depends_on:
      - db
    volumes:
      - ./scripts:/app/scripts
    environment:
      POSTGRES_HOST: db
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      S3_BUCKET: ${S3_BUCKET}

volumes:
  postgres_data:
```

## Validation Checklist

### Pre-Production
- [ ] PostgreSQL configured with `wal_level = replica`
- [ ] Archive directory writable by postgres user
- [ ] S3 bucket created and credentials working
- [ ] Encryption key generated and stored securely
- [ ] Backup script tested locally
- [ ] Restore test completed successfully
- [ ] Cron/scheduler configured
- [ ] Slack/email alerts configured

### Weekly Operations
- [ ] Monitor backup.log for errors
- [ ] Verify backup_manifest.log entries
- [ ] Confirm restore test succeeded
- [ ] Check S3 for uploaded backups
- [ ] Verify disk space available

### Monthly
- [ ] Review retention policy effectiveness
- [ ] Test restore to alternate environment
- [ ] Update documentation if needed
- [ ] Review backup metrics (size, time, success rate)

## Recovery Procedures

### Quick Recovery (Last Full Backup)
```bash
./scripts/backup_postgres.sh restore /app/backups/full/backup_full_20260126_020000.sql.gz
```

### Point-in-Time Recovery (Within WAL retention)
See: OPERATIONS_PITR_RECOVERY.md

### Disaster Recovery (Complete data loss)
```bash
# 1. Download backup from S3
aws s3 cp s3://company-backups/backups/postgres/backup_full_20260126_020000.sql.gz.enc ./

# 2. Decrypt (if encrypted)
openssl enc -aes-256-cbc -d -in backup_full_20260126_020000.sql.gz.enc -out backup_full_20260126_020000.sql.gz -k "${ENCRYPTION_KEY}"

# 3. Restore
./scripts/backup_postgres.sh restore ./backup_full_20260126_020000.sql.gz

# 4. Verify restore
./scripts/backup_postgres.sh verify ./backup_full_20260126_020000.sql.gz
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Backup Duration**
   - Alert if > 1 hour (performance regression)
   - Alert if < 10 minutes (suspicious, may be incomplete)

2. **Backup Size**
   - Alert if increased > 50% from previous week
   - Indicates possible data bloat

3. **Restore Test Success**
   - CRITICAL: Alert if restore test fails
   - Indicates backups may be corrupted

4. **Disk Space**
   - Alert if backup directory > 80% of disk

### Prometheus Metrics

```yaml
# Example: Create metrics file during backup
echo "backup_duration_seconds $(( $end_time - $start_time ))" >> /metrics/backup.prom
echo "backup_size_bytes $(stat -f%z "$backup_file")" >> /metrics/backup.prom
echo "backup_success {status=\"success\"}" >> /metrics/backup.prom
```

## Security Best Practices

1. ✅ **Backups Encrypted**
   ```bash
   openssl enc -aes-256-cbc -salt -in file -out file.enc
   ```

2. ✅ **Backups Off-Site**
   - S3 with versioning enabled
   - Separate AWS account for backups

3. ✅ **Access Control**
   - Restrict backup directory to postgres user
   - Restrict S3 bucket to backup service account
   - Separate credentials for restore

4. ✅ **Immutable Backups**
   ```bash
   # After successful upload, make local backup read-only
   chmod 444 /app/backups/full/backup_full_*.sql.gz
   ```

5. ✅ **Tested Restores**
   - Run restore test weekly to catch corruption early
   - Test in isolated environment (not production)

## Cost Optimization

### S3 Storage Classes

```
Week 1-2:  STANDARD        (Frequent access)
Week 2-4:  STANDARD_IA     (Infrequent access)
Week 4+:   GLACIER         (Archive)
```

### Configuration

```bash
# On upload, set appropriate storage class
aws s3 cp backup.sql.gz s3://bucket/backups/ \
  --storage-class STANDARD_IA
```

## Troubleshooting

### Backup Fails

```bash
# Check connection
PGPASSWORD=xxx psql -h host -U postgres -d hrms_db -c "SELECT version();"

# Check disk space
df -h /app/backups

# Check PostgreSQL logs
docker logs postgres | grep backup
```

### Restore Fails

```bash
# Verify backup integrity
gzip -t backup_full_*.sql.gz

# Check restore database permissions
PGPASSWORD=xxx psql -h host -U postgres -c "SELECT rolname, rolcanlogin FROM pg_roles;"
```

### WAL Archiving Not Working

```bash
# Check WAL directory
ls -la /app/backups/wal_archive/ | head

# Check PostgreSQL archive_command logs
grep "archive_command" /var/log/postgresql/postgresql.log

# Manually test archive command
test ! -f /app/backups/wal_archive/test && cp /app/backups/wal_archive/test && echo "OK"
```

## References

- PostgreSQL Continuous Archiving: https://www.postgresql.org/docs/current/continuous-archiving.html
- django-tenants Multi-Tenant Backup: https://django-tenants.readthedocs.io/en/latest/
- AWS S3 Best Practices: https://docs.aws.amazon.com/AmazonS3/latest/userguide/BestPractices.html
