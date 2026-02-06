import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

/**
 * K6 Load Testing Script for Multi-Tenant HRMS
 * 
 * Tool: k6 (Grafana's load testing framework)
 * Install: go install github.com/grafana/k6@latest
 * 
 * Run:
 *   k6 run load_test_hrms.js
 *   k6 run --vus 50 --duration 5m load_test_hrms.js
 *   k6 run --stage 2m:10 --stage 5m:50 --stage 2m:0 load_test_hrms.js
 * 
 * Options:
 *   --vus: Virtual users (concurrency)
 *   --duration: Test duration
 *   --stage: Ramp-up/down patterns
 *   --rps: Requests per second limit
 */

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const employeeFetchDuration = new Trend('employee_fetch_duration');
const attendanceCheckDuration = new Trend('attendance_check_duration');
const payslipGenerateDuration = new Trend('payslip_generate_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8001';
const TENANT_SLUG = __ENV.TENANT_SLUG || 'public';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@psintellhr.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'admin123';

// Test scenarios
export const options = {
  // Scenario 1: Smoke test - Verify basic functionality
  smoke: {
    vus: 5,
    duration: '5m',
    thresholds: {
      http_req_duration: ['p(95)<500'],
      errors: ['rate<0.1'],
    },
  },

  // Scenario 2: Load test - Normal production load
  load: {
    stages: [
      { duration: '2m', target: 10 },   // Ramp up
      { duration: '5m', target: 10 },   // Stay at 10 users
      { duration: '2m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000', 'p(99)<2000'],
      errors: ['rate<0.05'],
    },
  },

  // Scenario 3: Stress test - Find breaking point
  stress: {
    stages: [
      { duration: '2m', target: 10 },
      { duration: '3m', target: 50 },   // Increase load
      { duration: '3m', target: 100 },  // Heavy load
      { duration: '3m', target: 200 },  // Stress point
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<3000'],
      errors: ['rate<0.20'],
    },
  },

  // Scenario 4: Spike test - Handle sudden traffic spikes
  spike: {
    stages: [
      { duration: '2m', target: 10 },
      { duration: '1m', target: 100 },  // Sudden spike
      { duration: '5m', target: 100 },  // Hold spike
      { duration: '1m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      errors: ['rate<0.10'],
    },
  },

  // Scenario 5: Endurance test - 24 hour simulation
  endurance: {
    stages: [
      { duration: '5m', target: 20 },
      { duration: '8h', target: 20 },   // 8 hours at steady load
      { duration: '5m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<1500'],
      errors: ['rate<0.05'],
    },
  },

  // Default: smoke test
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

// Global setup
export function setup() {
  console.log('Setup: Logging in as admin...');
  
  const loginResponse = http.post(
    `${BASE_URL}/api/v1/token/`,
    {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Slug': TENANT_SLUG,
      },
    }
  );

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  const { access } = loginResponse.json();
  console.log('Setup: Login successful, token obtained');
  
  return { token: access };
}

/**
 * Test 1: Authentication Flow
 */
export function testAuthentication(data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': TENANT_SLUG,
    },
  };

  const loginResponse = http.post(
    `${BASE_URL}/api/v1/token/`,
    {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
    params
  );

  const success = check(loginResponse, {
    'login status 200': (r) => r.status === 200,
    'token returned': (r) => r.json('access') !== null,
  });

  errorRate.add(!success);
  loginDuration.add(loginResponse.timings.duration);

  if (!success) {
    console.error(`Auth test failed: ${loginResponse.status}`);
  }
}

/**
 * Test 2: Employee List Retrieval
 */
export function testEmployeeList(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'X-Tenant-Slug': TENANT_SLUG,
      'Content-Type': 'application/json',
    },
  };

  const listResponse = http.get(
    `${BASE_URL}/api/v1/employees/?limit=100`,
    params
  );

  const success = check(listResponse, {
    'employee list status 200': (r) => r.status === 200,
    'has results': (r) => r.json('count') !== null,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!success);
  employeeFetchDuration.add(listResponse.timings.duration);

  if (!success) {
    console.error(`Employee list failed: ${listResponse.status}`);
  }

  sleep(1);
}

/**
 * Test 3: Attendance Check-In
 */
export function testAttendanceCheckIn(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'X-Tenant-Slug': TENANT_SLUG,
      'Content-Type': 'application/json',
    },
  };

  const checkInResponse = http.post(
    `${BASE_URL}/api/v1/attendance/check-in/`,
    {
      status: 'present',
      location: { lat: 40.7128, lng: -74.0060 },
    },
    params
  );

  const success = check(checkInResponse, {
    'check-in status 200/201': (r) => [200, 201].includes(r.status),
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!success);
  attendanceCheckDuration.add(checkInResponse.timings.duration);

  sleep(2);
}

/**
 * Test 4: Payslip Generation (Async Task)
 */
export function testPayslipGeneration(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'X-Tenant-Slug': TENANT_SLUG,
      'Content-Type': 'application/json',
    },
  };

  // Trigger payslip generation (returns task ID)
  const generateResponse = http.post(
    `${BASE_URL}/api/v1/payroll/generate-payslips/`,
    {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
    params
  );

  const success = check(generateResponse, {
    'payslip generation accepted 202': (r) => r.status === 202,
    'task_id returned': (r) => r.json('task_id') !== null,
  });

  errorRate.add(!success);
  payslipGenerateDuration.add(generateResponse.timings.duration);

  // Check task status
  if (success) {
    sleep(2);
    const taskId = generateResponse.json('task_id');
    const statusResponse = http.get(
      `${BASE_URL}/api/v1/tasks/${taskId}/`,
      params
    );
    check(statusResponse, {
      'task status retrievable': (r) => r.status === 200,
    });
  }

  sleep(3);
}

/**
 * Test 5: Tenant Isolation (Cross-Tenant Access Should Fail)
 */
export function testTenantIsolation(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'X-Tenant-Slug': 'wrong-tenant', // Try different tenant
      'Content-Type': 'application/json',
    },
  };

  const isolationResponse = http.get(
    `${BASE_URL}/api/v1/employees/`,
    params
  );

  const success = check(isolationResponse, {
    'cross-tenant access blocked': (r) => [403, 404].includes(r.status),
  });

  if (!success) {
    console.error('SECURITY: Tenant isolation test FAILED');
    errorRate.add(1);
  }

  sleep(1);
}

/**
 * Test 6: Concurrent User Simulation
 */
export function testConcurrentUsers(data) {
  // Simulate different user activities simultaneously
  testEmployeeList(data);
  testAttendanceCheckIn(data);
  // Don't run payslip generation here (heavy operation)
}

/**
 * Test 7: Error Handling (Various Error Scenarios)
 */
export function testErrorHandling(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'X-Tenant-Slug': TENANT_SLUG,
      'Content-Type': 'application/json',
    },
  };

  // Test 404 - Non-existent employee
  const notFoundResponse = http.get(
    `${BASE_URL}/api/v1/employees/99999/`,
    params
  );
  check(notFoundResponse, {
    '404 on non-existent resource': (r) => r.status === 404,
  });

  // Test 400 - Invalid request
  const invalidResponse = http.post(
    `${BASE_URL}/api/v1/employees/`,
    { /* missing required fields */ },
    params
  );
  check(invalidResponse, {
    '400 on invalid request': (r) => r.status === 400,
  });

  // Test 403 - Unauthorized operation
  const unauthorizedResponse = http.post(
    `${BASE_URL}/api/v1/admin/settings/`,
    { setting: 'value' },
    params
  );
  check(unauthorizedResponse, {
    '403 on unauthorized operation': (r) => r.status === 403,
  });

  sleep(1);
}

/**
 * Main Test Execution
 */
export default function (data) {
  // Run different tests with different probabilities
  const scenario = Math.random();

  if (scenario < 0.3) {
    testAuthentication(data);
  } else if (scenario < 0.5) {
    testEmployeeList(data);
  } else if (scenario < 0.65) {
    testAttendanceCheckIn(data);
  } else if (scenario < 0.75) {
    testTenantIsolation(data);
  } else if (scenario < 0.85) {
    testConcurrentUsers(data);
  } else if (scenario < 0.95) {
    testErrorHandling(data);
  } else {
    testPayslipGeneration(data);  // Heavy operation, low frequency
  }
}

/**
 * Test Cleanup
 */
export function teardown(data) {
  console.log('Teardown: Cleaning up...');
  
  // Could delete test data here
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'X-Tenant-Slug': TENANT_SLUG,
    },
  };

  // Example: Clean up test records
  // http.delete(`${BASE_URL}/api/v1/test-records/`, params);

  console.log('Teardown: Complete');
}

/**
 * Custom Summary Handler
 */
export function handleSummary(data) {
  console.log('=== Test Summary ===');
  console.log(`Total duration: ${data.state.testRunDurationMs}ms`);
  console.log(`Total requests: ${data.metrics.http_reqs.value}`);
  console.log(`Total errors: ${data.metrics.http_req_failed.value}`);
  console.log(`Error rate: ${((data.metrics.errors.value / data.metrics.http_reqs.value) * 100).toFixed(2)}%`);
}
