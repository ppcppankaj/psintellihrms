#!/bin/bash
################################################################################
# PRODUCTION PRE-LAUNCH VERIFICATION SCRIPT
#
# Run this checklist 24 hours before production launch
# All checks must PASS (✅) before proceeding
#
# Usage: ./scripts/prelaunch_verification.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   PRODUCTION PRE-LAUNCH VERIFICATION CHECKLIST                 ║"
echo "║   PS IntelliHR Multi-Tenant HRMS                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ============================================================================
# CHECK FUNCTIONS
# ============================================================================

check() {
    local num=$1
    local description=$2
    local command=$3
    
    echo -n "[$num/20] $description ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

warning() {
    local num=$1
    local description=$2
    local message=$3
    
    echo -n "[$num/20] $description ... "
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    echo "    $message"
    ((WARNINGS++))
}

# ============================================================================
# CHECKS
# ============================================================================

echo -e "${BLUE}=== BACKEND CHECKS ===${NC}"

check 1 "Backend container running" \
    "docker-compose ps backend | grep -q 'Up'"

check 2 "Backend health endpoint responding" \
    "curl -s http://localhost:8000/api/health/ | grep -q 'status'"

check 3 "Database connection working" \
    "docker-compose exec db psql -U postgres -d hrms_db -c 'SELECT 1;' > /dev/null"

check 4 "Redis connection working" \
    "docker-compose exec redis redis-cli ping | grep -q PONG"

check 5 "Celery worker running" \
    "docker-compose ps celery | grep -q 'Up'"

check 6 "Celery beat running" \
    "docker-compose ps beat | grep -q 'Up'"

check 7 "Tenant isolation tests passing" \
    "docker-compose exec backend pytest apps/tenants/tests/test_tenant_isolation.py -q"

check 8 "All migrations applied" \
    "! docker-compose exec backend python manage.py showmigrations | grep -q '(\s*)'"

check 9 "Migration validation passing" \
    "docker-compose exec backend python manage.py validate_migrations"

check 10 "Public tenant exists" \
    "docker-compose exec backend python manage.py shell -c 'from apps.tenants.models import Tenant; print(Tenant.objects.filter(schema_name=\"public\").exists())' | grep -q True"

echo ""
echo -e "${BLUE}=== OPERATIONAL CHECKS ===${NC}"

check 11 "Backup script exists and executable" \
    "[ -x backend/scripts/backup_postgres.sh ]"

check 12 "Latest backup exists" \
    "[ -n '$(ls -t /app/backups/full/*.sql.gz 2>/dev/null | head -1)' ]"

check 13 "Monitoring script exists" \
    "[ -x scripts/simple_monitoring.sh ]"

check 14 "Safe deployment script exists" \
    "[ -x scripts/safe_deploy.sh ]"

check 15 "Staging environment configured" \
    "[ -f docker-compose.staging.yml ]"

check 16 "Load testing framework exists" \
    "[ -f scripts/load_test_hrms.js ]"

check 17 "Rate limiting middleware installed" \
    "grep -q 'PerTenantRateLimitMiddleware' backend/config/settings/base.py"

check 18 "Error boundary component exists" \
    "[ -f frontend/src/components/ErrorBoundary.tsx ]"

echo ""
echo -e "${BLUE}=== DOCUMENTATION CHECKS ===${NC}"

check 19 "Operational runbooks complete" \
    "[ -f OPERATIONS_RUNBOOKS.md ] && [ $(wc -l < OPERATIONS_RUNBOOKS.md) -gt 500 ]"

check 20 "Production readiness assessment complete" \
    "[ -f PRODUCTION_READINESS_FINAL_UNCONDITIONAL.md ]"

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VERIFICATION SUMMARY                                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

total=$((PASSED + FAILED + WARNINGS))

echo ""
echo -e "  Passed:    ${GREEN}$PASSED/20${NC}"
echo -e "  Failed:    ${RED}$FAILED/20${NC}"
echo -e "  Warnings:  ${YELLOW}$WARNINGS/20${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🟢 ALL CHECKS PASSED - READY FOR PRODUCTION LAUNCH            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review PRODUCTION_READINESS_FINAL_UNCONDITIONAL.md"
    echo "  2. Confirm with engineering lead"
    echo "  3. Schedule launch window"
    echo "  4. Have on-call engineer standing by"
    echo "  5. Run: ./scripts/safe_deploy.sh [version]"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  🔴 $FAILED CHECKS FAILED - DO NOT LAUNCH                      ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please fix failures before launching:"
    echo "  1. Review failed checks above"
    echo "  2. Check logs: docker-compose logs [service]"
    echo "  3. Restart services if needed: docker-compose restart"
    echo "  4. Re-run this verification: ./scripts/prelaunch_verification.sh"
    exit 1
fi
