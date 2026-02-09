# API Changelog

All notable changes to the PS IntelliHR API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- _No unreleased changes_

---

## [1.0.0] - 2026-02-09

### Contract Frozen 🔒

This version represents the **contract-frozen** baseline for `/api/v1/`.

#### Stats
- **515 API paths**
- **570 schema definitions**
- **21 application modules**

#### Modules Included
- Authentication & Authorization
- Employee Management
- Leave Management
- Attendance Tracking
- Payroll & Compensation
- Performance Management
- Recruitment
- Training & Development
- Workflow Approvals
- Reports & Analytics
- Notifications
- Compliance
- Billing
- Integrations
- AI Services

---

## Change Policy

### Allowed Changes (Additive)
- ✅ New optional fields
- ✅ New endpoints
- ✅ New query parameters
- ✅ Performance improvements
- ✅ Bug fixes (behavior-preserving)

### Prohibited Changes (Breaking)
- ❌ Removing fields
- ❌ Renaming fields
- ❌ Changing field types
- ❌ Making optional fields required
- ❌ Changing response shapes
- ❌ Removing endpoints
- ❌ Changing HTTP methods

### Breaking Change Process
1. Create `/api/v2/` namespace
2. Maintain v1 for 12+ months
3. Document migration path
4. Communicate deprecation timeline
