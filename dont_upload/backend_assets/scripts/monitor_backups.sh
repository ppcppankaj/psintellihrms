#!/bin/bash
################################################################################
# Backup Monitoring and Alert Script
# 
# Purpose: Monitor backup jobs and send alerts for failures
# Usage: ./monitor_backups.sh
# Cron: 0 */4 * * * /app/scripts/monitor_backups.sh
################################################################################

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
LOG_FILE="${BACKUP_DIR}/logs/backup.log"
MANIFEST_FILE="${BACKUP_DIR}/logs/backup_manifest.log"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

# Thresholds
MAX_HOURS_SINCE_BACKUP=26  # Alert if no backup in 26 hours (weekly backup)
MAX_BACKUP_SIZE_INCREASE=150  # Alert if increased > 150% from average
MIN_BACKUP_SIZE=1000000  # Alert if backup < 1MB (suspicious)

send_alert() {
    local severity="$1"
    local message="$2"
    
    # Send to Slack
    if [ -n "${SLACK_WEBHOOK}" ]; then
        local color="danger"
        [ "${severity}" = "warning" ] && color="warning"
        [ "${severity}" = "success" ] && color="good"
        
        curl -X POST "${SLACK_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"${color}\",
                    \"title\": \"Backup Alert: ${severity}\",
                    \"text\": \"${message}\",
                    \"ts\": $(date +%s)
                }]
            }" 2>&1 || true
    fi
    
    # Send email
    if [ -n "${ALERT_EMAIL}" ]; then
        echo "${message}" | mail -s "Backup Alert [${severity}]" "${ALERT_EMAIL}" || true
    fi
}

check_backup_age() {
    local latest_backup=$(find "${BACKUP_DIR}/full" -name "backup_full_*.sql.gz*" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2)
    
    if [ -z "${latest_backup}" ]; then
        send_alert "critical" "No backups found in ${BACKUP_DIR}/full"
        return 1
    fi
    
    local backup_age=$(( $(date +%s) - $(stat -f%m "${latest_backup}" 2>/dev/null || stat -c%Y "${latest_backup}") ))
    local hours_ago=$(( backup_age / 3600 ))
    
    if [ "${hours_ago}" -gt "${MAX_HOURS_SINCE_BACKUP}" ]; then
        send_alert "critical" "Last backup is ${hours_ago} hours old (threshold: ${MAX_HOURS_SINCE_BACKUP}h). File: $(basename "${latest_backup}")"
        return 1
    fi
    
    echo "✓ Last backup age: ${hours_ago} hours"
}

check_backup_size() {
    local latest_backup=$(find "${BACKUP_DIR}/full" -name "backup_full_*.sql.gz*" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2)
    local current_size=$(stat -f%z "${latest_backup}" 2>/dev/null || stat -c%s "${latest_backup}")
    
    if [ "${current_size}" -lt "${MIN_BACKUP_SIZE}" ]; then
        send_alert "critical" "Backup size is suspiciously small: $(( current_size / 1024 ))KB (min threshold: $(( MIN_BACKUP_SIZE / 1024 ))KB)"
        return 1
    fi
    
    # Get average backup size from manifest
    local avg_size=$(tail -100 "${MANIFEST_FILE}" 2>/dev/null | awk -F' | ' '{print $4}' | grep -oE '[0-9]+' | awk '{sum+=$1; count++} END {print sum/count}' || echo 0)
    
    if [ -n "${avg_size}" ] && [ "${avg_size}" -gt 0 ]; then
        local increase=$(( (current_size * 100) / avg_size ))
        if [ "${increase}" -gt "${MAX_BACKUP_SIZE_INCREASE}" ]; then
            send_alert "warning" "Backup size increased $(( (increase - 100) ))% from average (current: $(( current_size / 1024 / 1024 ))MB, avg: $(( avg_size / 1024 / 1024 ))MB)"
        fi
    fi
    
    echo "✓ Backup size: $(( current_size / 1024 / 1024 ))MB"
}

check_restore_test() {
    local latest_test=$(find "${BACKUP_DIR}/restore_tests" -name "*.log" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2)
    
    if [ -z "${latest_test}" ]; then
        send_alert "warning" "No restore tests found. Backups have not been verified."
        return 1
    fi
    
    local test_age=$(( $(date +%s) - $(stat -f%m "${latest_test}" 2>/dev/null || stat -c%Y "${latest_test}") ))
    local days_ago=$(( test_age / 86400 ))
    
    if [ "${days_ago}" -gt 8 ]; then
        send_alert "warning" "Last restore test is ${days_ago} days old. Backups may not have been tested."
        return 1
    fi
    
    if ! grep -q "SUCCESS" "${latest_test}"; then
        send_alert "critical" "Last restore test FAILED. Backups may be corrupted."
        return 1
    fi
    
    echo "✓ Restore test passed ${days_ago} days ago"
}

check_disk_space() {
    local disk_usage=$(df "${BACKUP_DIR}" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "${disk_usage}" -gt 80 ]; then
        send_alert "warning" "Backup directory disk usage is ${disk_usage}% (threshold: 80%)"
        return 1
    fi
    
    echo "✓ Disk usage: ${disk_usage}%"
}

check_backup_errors() {
    if [ ! -f "${LOG_FILE}" ]; then
        return 0
    fi
    
    local errors=$(grep -c "ERROR\|FAILED\|CRITICAL" "${LOG_FILE}" | tail -1 || echo 0)
    
    if [ "${errors}" -gt 0 ]; then
        local recent_errors=$(grep "ERROR\|FAILED\|CRITICAL" "${LOG_FILE}" | tail -3 | tr '\n' ' ')
        send_alert "warning" "Found ${errors} errors in backup logs: ${recent_errors}"
        return 1
    fi
    
    echo "✓ No errors in backup logs"
}

main() {
    echo "========================================"
    echo "Backup Monitoring Report"
    echo "========================================"
    echo "Time: $(date)"
    echo ""
    
    check_backup_age || true
    check_backup_size || true
    check_restore_test || true
    check_disk_space || true
    check_backup_errors || true
    
    echo ""
    echo "========================================"
    echo "Monitoring complete"
    echo "========================================"
}

main "$@"
