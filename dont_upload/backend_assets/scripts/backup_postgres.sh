#!/bin/bash
################################################################################
# PostgreSQL Automated Backup Script for Multi-Tenant HRMS
# 
# Purpose: 
#   - Backup entire PostgreSQL database with all tenant schemas
#   - Support point-in-time recovery
#   - Encrypt backups for security
#   - Upload to off-host storage (S3/MinIO)
#   - Verify backups are valid
#
# Usage:
#   ./backup_postgres.sh [full|incremental|verify|restore]
#
# Environment variables:
#   POSTGRES_HOST: Database host (default: localhost)
#   POSTGRES_USER: Database user (default: postgres)
#   POSTGRES_PASSWORD: Database password
#   POSTGRES_DB: Database name (default: hrms_db)
#   BACKUP_DIR: Local backup directory (default: /app/backups)
#   S3_BUCKET: S3 bucket for storage
#   S3_REGION: AWS region
#   AWS_ACCESS_KEY_ID: AWS credentials
#   AWS_SECRET_ACCESS_KEY: AWS credentials
#
################################################################################

set -euo pipefail

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-hrms_db}"
BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
S3_BUCKET="${S3_BUCKET:-}"
S3_REGION="${S3_REGION:-us-east-1}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "${BACKUP_DIR}"/{full,incremental,logs,restore_tests}

################################################################################
# LOGGING FUNCTIONS
################################################################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${LOG_FILE}"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "${LOG_FILE}"
}

################################################################################
# HEALTH CHECKS
################################################################################

check_postgres_connection() {
    log_info "Checking PostgreSQL connection..."
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -c "SELECT version();" > /dev/null 2>&1; then
        log_error "Failed to connect to PostgreSQL"
        exit 1
    fi
    log_info "✓ PostgreSQL connection successful"
}

check_disk_space() {
    local db_size=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -t -c "SELECT pg_database_size('${POSTGRES_DB}') / 1024 / 1024;" | xargs)
    
    local required_space=$((db_size * 2))  # 2x database size for safety
    local available_space=$(df "${BACKUP_DIR}" | tail -1 | awk '{print $4}')
    
    if [ "${available_space}" -lt "${required_space}" ]; then
        log_error "Insufficient disk space. Required: ${required_space}MB, Available: ${available_space}MB"
        exit 1
    fi
    log_info "✓ Disk space check passed (${available_space}MB available)"
}

################################################################################
# FULL BACKUP (DEFAULT - RECOMMENDED WEEKLY)
################################################################################

backup_full() {
    local backup_file="${BACKUP_DIR}/full/backup_full_$(date +%Y%m%d_%H%M%S).sql.gz"
    local backup_name=$(basename "${backup_file}")
    
    log_info "Starting full database backup..."
    log_info "Backup file: ${backup_file}"
    
    # Take backup using pg_dump
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -Fc \
        --no-acl \
        --no-owner \
        -v 2>&1 | gzip > "${backup_file}"; then
        log_error "Failed to create backup"
        rm -f "${backup_file}"
        exit 1
    fi
    
    local backup_size=$(du -h "${backup_file}" | cut -f1)
    log_info "✓ Full backup completed: ${backup_size}"
    
    # Encrypt backup if encryption key provided
    if [ -n "${ENCRYPTION_KEY}" ]; then
        encrypt_backup "${backup_file}"
    fi
    
    # Upload to S3 if configured
    if [ -n "${S3_BUCKET}" ]; then
        upload_to_s3 "${backup_file}"
    fi
    
    # Verify backup integrity
    verify_backup_integrity "${backup_file}"
    
    # Store backup metadata
    store_backup_metadata "${backup_file}" "full"
}

################################################################################
# INCREMENTAL BACKUP (DAILY - USING WAL ARCHIVING)
################################################################################

backup_incremental() {
    log_info "Incremental backup (WAL archiving) is enabled via PostgreSQL configuration"
    log_info "Ensure postgresql.conf has:"
    log_info "  wal_level = replica"
    log_info "  archive_mode = on"
    log_info "  archive_command = 'cp %p /app/backups/wal_archive/%f'"
    log_info "Incremental backups are created automatically via WAL archiving"
}

################################################################################
# ENCRYPTION
################################################################################

encrypt_backup() {
    local backup_file="$1"
    local encrypted_file="${backup_file}.enc"
    
    log_info "Encrypting backup with AES-256..."
    
    if ! openssl enc -aes-256-cbc \
        -salt \
        -in "${backup_file}" \
        -out "${encrypted_file}" \
        -k "${ENCRYPTION_KEY}" 2>&1; then
        log_error "Failed to encrypt backup"
        rm -f "${encrypted_file}"
        return 1
    fi
    
    rm -f "${backup_file}"
    log_info "✓ Backup encrypted: ${encrypted_file}"
}

################################################################################
# S3 UPLOAD
################################################################################

upload_to_s3() {
    local backup_file="$1"
    local backup_name=$(basename "${backup_file}")
    local s3_path="s3://${S3_BUCKET}/backups/postgres/${backup_name}"
    
    log_info "Uploading to S3: ${s3_path}"
    
    if ! aws s3 cp "${backup_file}" "${s3_path}" \
        --region "${S3_REGION}" \
        --sse AES256 \
        --storage-class STANDARD_IA 2>&1; then
        log_error "Failed to upload to S3"
        return 1
    fi
    
    log_info "✓ Backup uploaded to S3"
}

################################################################################
# BACKUP VERIFICATION
################################################################################

verify_backup_integrity() {
    local backup_file="$1"
    
    log_info "Verifying backup integrity..."
    
    # Check gzip validity
    if ! gzip -t "${backup_file}" 2>&1; then
        log_error "Backup file is corrupted (invalid gzip)"
        return 1
    fi
    
    log_info "✓ Backup integrity verified"
}

################################################################################
# TEST RESTORE IN ISOLATED ENVIRONMENT (WEEKLY)
################################################################################

test_restore() {
    local backup_file="$1"
    local test_db="test_restore_$(date +%s)"
    
    log_info "Testing restore from backup: ${backup_file}"
    
    # Create test database
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" createdb \
        -h "${POSTGRES_HOST}" \
        -U "${POSTGRES_USER}" \
        "${test_db}" 2>&1; then
        log_error "Failed to create test database"
        return 1
    fi
    
    # Restore backup
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
        -h "${POSTGRES_HOST}" \
        -U "${POSTGRES_USER}" \
        -d "${test_db}" \
        -v "${backup_file}" 2>&1 | tee -a "${LOG_FILE}"; then
        log_error "Failed to restore backup"
        PGPASSWORD="${POSTGRES_PASSWORD}" dropdb -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" "${test_db}"
        return 1
    fi
    
    # Verify test database
    local schema_count=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -U "${POSTGRES_USER}" \
        -d "${test_db}" \
        -t -c "SELECT COUNT(*) FROM information_schema.schemata;" | xargs)
    
    if [ "${schema_count}" -lt 2 ]; then
        log_error "Restored database has invalid schema count"
        PGPASSWORD="${POSTGRES_PASSWORD}" dropdb -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" "${test_db}"
        return 1
    fi
    
    log_info "✓ Restore test passed (schemas: ${schema_count})"
    
    # Cleanup test database
    PGPASSWORD="${POSTGRES_PASSWORD}" dropdb -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" "${test_db}"
}

################################################################################
# BACKUP RETENTION POLICY
################################################################################

cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    # Local cleanup
    find "${BACKUP_DIR}/full" -name "backup_full_*.sql.gz*" -mtime +"${RETENTION_DAYS}" -delete
    find "${BACKUP_DIR}/incremental" -name "*.backup" -mtime +"${RETENTION_DAYS}" -delete
    
    log_info "✓ Old backups cleaned up"
}

################################################################################
# BACKUP METADATA STORAGE
################################################################################

store_backup_metadata() {
    local backup_file="$1"
    local backup_type="$2"
    local metadata_file="${BACKUP_DIR}/logs/backup_manifest.log"
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local file_size=$(du -h "${backup_file}" | cut -f1)
    local checksum=$(sha256sum "${backup_file}" | awk '{print $1}')
    
    echo "${timestamp} | ${backup_type} | $(basename "${backup_file}") | ${file_size} | ${checksum}" >> "${metadata_file}"
    
    log_info "✓ Backup metadata stored"
}

################################################################################
# RESTORE PROCEDURE (MANUAL)
################################################################################

restore_from_backup() {
    local backup_file="$1"
    local target_db="${POSTGRES_DB}"
    
    log_warn "Starting database restore from: ${backup_file}"
    log_warn "This will overwrite the current database. Continue? (yes/no)"
    read -r confirmation
    
    if [ "${confirmation}" != "yes" ]; then
        log_info "Restore cancelled"
        return 1
    fi
    
    # Backup current database first
    log_info "Creating backup of current database before restore..."
    backup_full
    
    # Drop existing database and recreate
    log_info "Dropping existing database: ${target_db}"
    PGPASSWORD="${POSTGRES_PASSWORD}" dropdb -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" "${target_db}"
    
    log_info "Creating new database: ${target_db}"
    PGPASSWORD="${POSTGRES_PASSWORD}" createdb -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" "${target_db}"
    
    # Restore from backup
    log_info "Restoring from backup..."
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
        -h "${POSTGRES_HOST}" \
        -U "${POSTGRES_USER}" \
        -d "${target_db}" \
        -v "${backup_file}"; then
        log_error "Restore failed"
        return 1
    fi
    
    log_info "✓ Restore completed successfully"
    log_info "Database ready: ${target_db}"
}

################################################################################
# POINT-IN-TIME RECOVERY (PITR)
################################################################################

pitr_recovery() {
    local target_time="$1"  # Format: '2026-01-26 14:30:00'
    local recovery_db="${POSTGRES_DB}_pitr_$(date +%s)"
    
    log_info "Performing Point-in-Time Recovery to: ${target_time}"
    log_info "New database: ${recovery_db}"
    
    # This requires:
    # 1. Full backup + WAL files
    # 2. PostgreSQL recovery.conf configuration
    # See: https://www.postgresql.org/docs/current/continuous-archiving.html
    
    log_warn "PITR recovery is a manual process requiring:"
    log_warn "  1. Stop PostgreSQL"
    log_warn "  2. Restore full backup to new directory"
    log_warn "  3. Create recovery.conf with recovery_target_time"
    log_warn "  4. Start PostgreSQL to complete PITR"
    log_warn "See OPERATIONS_PITR_RECOVERY.md for detailed steps"
}

################################################################################
# MAIN COMMAND HANDLER
################################################################################

main() {
    local command="${1:-full}"
    
    log_info "=========================================="
    log_info "PostgreSQL Backup Manager"
    log_info "=========================================="
    log_info "Command: ${command}"
    log_info "Database: ${POSTGRES_DB}@${POSTGRES_HOST}:${POSTGRES_PORT}"
    
    check_postgres_connection
    check_disk_space
    
    case "${command}" in
        full)
            backup_full
            cleanup_old_backups
            ;;
        incremental)
            backup_incremental
            ;;
        verify)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 verify <backup_file>"
                exit 1
            fi
            verify_backup_integrity "$2"
            test_restore "$2"
            ;;
        restore)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 restore <backup_file>"
                exit 1
            fi
            restore_from_backup "$2"
            ;;
        pitr)
            if [ -z "${2:-}" ]; then
                log_error "Usage: $0 pitr '<target_time>'"
                exit 1
            fi
            pitr_recovery "$2"
            ;;
        *)
            log_error "Unknown command: ${command}"
            echo "Usage: $0 [full|incremental|verify|restore|pitr]"
            exit 1
            ;;
    esac
    
    log_info "=========================================="
    log_info "Operation completed successfully"
    log_info "=========================================="
}

main "$@"
