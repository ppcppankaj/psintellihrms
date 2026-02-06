# Load & Stress Testing Guide

## Overview

This guide defines realistic load profiles and testing procedures for PS IntelliHR before production launch.

## Testing Goals

| Goal | Metric | Target | Tool |
|------|--------|--------|------|
| **Baseline Performance** | Response time (p95) | < 1s | k6 |
| **Identify Bottlenecks** | CPU/Memory usage | < 80% | k6 + monitoring |
| **Tenant Isolation Under Load** | Cross-tenant access blocked | 0 failures | k6 + custom test |
| **Safe Operating Limit** | Concurrent users | TBD | k6 stress test |
| **Failure Graceful Degradation** | Error handling | < 1% error rate | k6 |

## Realistic Load Profiles

### Small Deployment (Early Stage)
```
Peak concurrent users:    50-100
Requests per second:      500-1000
Database size:            10-50 GB
Active tenants:           5-20
```

### Medium Deployment (Growth Phase)
```
Peak concurrent users:    200-500
Requests per second:      2000-5000
Database size:            100-500 GB
Active tenants:           50-200
```

### Enterprise Deployment (Mature)
```
Peak concurrent users:    1000+
Requests per second:      10000+
Database size:            1-5 TB
Active tenants:           500+
```

### Business Hours Pattern

```
00:00-06:00 UTC: 10% of peak (night)
06:00-09:00 UTC: 40% of peak (morning ramp)
09:00-17:00 UTC: 100% of peak (business hours)
17:00-20:00 UTC: 60% of peak (evening wind-down)
20:00-00:00 UTC: 30% of peak (night usage)
```

## Installation

### K6 (Recommended - Simple & Fast)

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Docker
docker run -i grafana/k6 run - < load_test_hrms.js

# Verify
k6 version
```

### Locust (Alternative - Python-based)

```bash
pip install locust
locust -f locustfile.py --host=http://localhost:8001
```

## Running Tests

### Test 1: Smoke Test (Verify Basic Functionality)

Validates that the system is working before load testing:

```bash
# Run 5 users for 5 minutes
k6 run --vus 5 --duration 5m load_test_hrms.js

# With environment variables
BASE_URL=http://localhost:8001 \
TENANT_SLUG=public \
ADMIN_EMAIL=admin@psintellhr.com \
ADMIN_PASSWORD=admin123 \
k6 run load_test_hrms.js
```

**Expected Results:**
- ✅ All checks pass
- ✅ Error rate < 1%
- ✅ Response time p95 < 500ms

**What it tests:**
- Authentication flow
- Employee list retrieval
- Attendance check-in
- Error handling (404, 400, 403)

---

### Test 2: Load Test (Normal Production Load)

Simulates typical business day traffic:

```bash
# Ramp up to 50 users over 2 minutes, maintain 5 minutes, ramp down
k6 run --stage 2m:50 --stage 5m:50 --stage 2m:0 load_test_hrms.js

# With output
k6 run \
  --stage 2m:50 --stage 5m:50 --stage 2m:0 \
  --out csv=results/load_test.csv \
  load_test_hrms.js
```

**Expected Results:**
- ✅ Error rate < 5%
- ✅ Response time p95 < 1000ms
- ✅ Response time p99 < 2000ms
- ✅ CPU usage < 70%
- ✅ Memory usage < 70%

**What it tests:**
- Steady-state performance
- Database query performance
- Response time consistency
- Memory leaks (sustained load)

---

### Test 3: Stress Test (Find Breaking Point)

Gradually increases load until system breaks:

```bash
# Ramp from 10 → 50 → 100 → 200 users
k6 run \
  --stage 2m:10 \
  --stage 3m:50 \
  --stage 3m:100 \
  --stage 3m:200 \
  --stage 2m:0 \
  load_test_hrms.js
```

**Expected Results:**
- ✅ Identify breaking point (typically 200-500 users)
- ✅ Graceful degradation (not crashes)
- ✅ Error rate gradually increases
- ✅ Response time increases smoothly

**What it tests:**
- Database connection limits
- Memory constraints
- CPU limits
- Queue depth under extreme load
- Graceful error handling

**Example Output:**
```
Stress Test Results:
- 0-50 users:    p95 response < 800ms, error rate 0%
- 50-100 users:  p95 response < 1200ms, error rate < 1%
- 100-200 users: p95 response < 2000ms, error rate < 5%
- 200+ users:    p95 response > 3000ms, error rate > 10% ← BREAKING POINT
```

---

### Test 4: Spike Test (Handle Traffic Spikes)

Simulates sudden traffic increase (e.g., announcement, mass adoption):

```bash
# 10 → 100 users in 1 minute (sudden spike)
k6 run \
  --stage 2m:10 \
  --stage 1m:100 \
  --stage 5m:100 \
  --stage 1m:0 \
  load_test_hrms.js
```

**Expected Results:**
- ✅ Handle spike without crashing
- ✅ Recover to normal performance after spike
- ✅ Error rate < 15% during spike
- ✅ No data loss

**What it tests:**
- Rate limiter effectiveness
- Auto-scaling (if configured)
- Connection pool handling
- Queue buildup and recovery

---

### Test 5: Endurance Test (8-Hour Simulation)

Detects memory leaks and performance degradation:

```bash
# 20 users for 8 hours
k6 run \
  --stage 5m:20 \
  --stage 8h:20 \
  --stage 5m:0 \
  load_test_hrms.js

# Or run in Docker for long-running
docker run -v $(pwd)/scripts:/scripts \
  grafana/k6 run \
  --stage 5m:20 \
  --stage 8h:20 \
  --stage 5m:0 \
  /scripts/load_test_hrms.js
```

**Expected Results:**
- ✅ Performance stable throughout 8 hours
- ✅ No memory leaks (memory usage steady)
- ✅ Response time consistent
- ✅ Error rate < 2%

**What it tests:**
- Memory leak detection
- Database connection stability
- Cache effectiveness
- Long-running task reliability

---

### Test 6: Tenant Isolation Under Load

Verifies tenant isolation doesn't break under concurrent requests:

```bash
# Embedded in main test - runs automatically
# Monitors that cross-tenant access is blocked
k6 run --vus 100 --duration 10m load_test_hrms.js

# Look for security test passes:
# ✓ cross-tenant access blocked
```

**Expected Results:**
- ✅ 100% of cross-tenant access attempts BLOCKED
- ✅ 0 security incidents
- ✅ No cross-tenant data visible

---

## Test Results Analysis

### Metrics to Monitor

```
Requests per Second (RPS)
├─ Successful RPS (should match overall RPS)
└─ Failed RPS (should be < 5% of overall)

Response Time
├─ Minimum (p0): Baseline performance
├─ Average: Expected response time
├─ P50 (median): Half requests faster
├─ P95: 95% of requests faster than this
├─ P99: 99% of requests faster than this
└─ Maximum: Worst-case scenario

Error Rate
├─ HTTP errors (4xx, 5xx)
├─ Timeouts
├─ Failed checks
└─ Connection errors

Resource Utilization
├─ CPU: Should stay < 80%
├─ Memory: Should stay < 80%
├─ Disk I/O: Should stay < 80%
└─ Network: Should stay < 80%
```

### Example Analysis

```bash
# Export and analyze results
k6 run --out csv=results/load_test.csv load_test_hrms.js

# View summary
grep "http_req_duration" results/load_test.csv | awk -F, '{print $3}' | sort -n | tail -100
```

## Pass/Fail Criteria

### Smoke Test - MUST PASS

```
✅ Error rate < 1%
✅ Response time p95 < 500ms
✅ All checks pass
```

### Load Test - SHOULD PASS

```
✅ Error rate < 5%
✅ Response time p95 < 1000ms
✅ Response time p99 < 2000ms
✅ CPU < 70%
✅ Memory < 70%
```

### Stress Test - FOR INFORMATION

```
? Identify breaking point
? Acceptable error rate at breaking point < 25%
? System recovers after load reduction
```

### Spike Test - SHOULD PASS

```
✅ Error rate < 15% during spike
✅ Response time p95 < 3000ms
✅ System recovers after spike
```

### Tenant Isolation - MUST PASS

```
✅ 100% of cross-tenant access blocked
✅ 0% security incidents
```

## Pre-Production Checklist

Before deploying to production, run all tests:

```bash
#!/bin/bash
# save as scripts/run_all_load_tests.sh

echo "🔥 Running Pre-Production Load Tests"

echo "1️⃣ Smoke Test"
k6 run --vus 5 --duration 5m load_test_hrms.js || exit 1

sleep 30

echo "2️⃣ Load Test (50 users, 10 minutes)"
k6 run --stage 2m:50 --stage 5m:50 --stage 2m:0 load_test_hrms.js || exit 1

sleep 30

echo "3️⃣ Spike Test (sudden 100 users)"
k6 run \
  --stage 2m:10 \
  --stage 1m:100 \
  --stage 5m:100 \
  --stage 1m:0 \
  load_test_hrms.js || exit 1

echo "✅ All load tests PASSED"
```

Run it:

```bash
chmod +x scripts/run_all_load_tests.sh
./scripts/run_all_load_tests.sh
```

## Troubleshooting

### Test Fails with Connection Errors

```bash
# Check backend is running
curl http://localhost:8001/api/health/

# Check no firewall blocking
telnet localhost 8001

# Check sufficient file descriptors
ulimit -n  # Should be > 10000
# Increase if needed: ulimit -n 50000
```

### High Error Rate

```bash
# Check backend logs
docker logs backend | tail -100

# Check database connections
docker exec db psql -U postgres -d hrms_db -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis
docker exec redis redis-cli INFO
```

### Memory Issues

```bash
# Monitor during test
watch -n 1 'docker stats backend --no-stream | grep backend'

# Check for memory leaks
k6 run --stage 30m:20 load_test_hrms.js
# Memory should remain stable, not grow linearly
```

## References

- K6 Documentation: https://k6.io/docs/
- K6 API Reference: https://k6.io/docs/javascript-api/
- Django Optimization: https://docs.djangoproject.com/en/stable/topics/performance/
