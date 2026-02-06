import { lazy } from 'react';

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const TwoFactorPage = lazy(() => import('@/pages/auth/TwoFactorPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));

// Dashboard
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ManagerDashboard = lazy(() => import('@/pages/dashboard/ManagerDashboard'));
const HRAnalyticsDashboard = lazy(() => import('@/pages/dashboard/HRAnalyticsDashboard'));

// Core Modules
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'));
const LeavePage = lazy(() => import('@/pages/leave/LeavePage'));
const EmployeesPage = lazy(() => import('@/pages/employees/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('@/pages/employees/EmployeeDetailPage'));
const EmployeeEditPage = lazy(() => import('@/pages/employees/EmployeeEditPage'));
const EmployeeCreatePage = lazy(() => import('@/pages/employees/EmployeeCreatePage'));

// ABAC (Attribute-Based Access Control)
const AbacDashboardPage = lazy(() => import('@/pages/abac/AbacDashboardPage'));
const AttributeTypesPage = lazy(() => import('@/pages/abac/AttributeTypesPage'));
const PoliciesPage = lazy(() => import('@/pages/abac/PoliciesPage'));

// Legacy RBAC (kept for backward compatibility)
const RolesPage = lazy(() => import('@/pages/rbac/RolesPage'));
const RoleDetailPage = lazy(() => import('@/pages/rbac/RoleDetailPage'));
const RoleEditPage = lazy(() => import('@/pages/rbac/RoleEditPage'));
const RoleCreatePage = lazy(() => import('@/pages/rbac/RoleCreatePage'));
const PermissionsPage = lazy(() => import('@/pages/rbac/PermissionsPage'));

// Workflows
const ApprovalsPage = lazy(() => import('@/pages/workflow/ApprovalsPage'));
const ApprovalDetailPage = lazy(() => import('@/pages/workflow/ApprovalDetailPage'));
const WorkflowHistoryPage = lazy(() => import('@/pages/workflow/WorkflowHistoryPage'));

// Other top level pages
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const AccessControlPage = lazy(() => import('@/pages/settings/PermissionsPage'));
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'));

// Payroll
const PayslipsPage = lazy(() => import('@/pages/payroll/PayslipsPage'));
const PayslipDetailPage = lazy(() => import('@/pages/payroll/PayslipDetailPage'));
const MyCompensationPage = lazy(() => import('@/pages/payroll/MyCompensationPage'));

// Reports
const ReportsDashboardPage = lazy(() => import('@/pages/reports/ReportsDashboardPage'));

// Billing
const BillingPage = lazy(() => import('@/pages/billing/BillingPage'));
const AdminBillingPage = lazy(() => import('@/pages/billing/AdminBillingPage'));
const PlansPage = lazy(() => import('@/pages/billing/PlansPage'));
const SubscriptionsPage = lazy(() => import('@/pages/billing/SubscriptionsPage'));

// Admin Generic
const AdminModulePage = lazy(() => import('@/pages/admin/AdminModulePage'))
const AIServicePage = lazy(() => import('@/pages/admin/AIServicePage'))
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'))
const IntegrationsPage = lazy(() => import('@/pages/admin/IntegrationsPage'));
const TenantManagementPage = lazy(() => import('@/pages/admin/TenantManagementPage'));
const SuperadminDashboard = lazy(() => import('@/pages/admin/SuperadminDashboard'));

// Onboarding & Expenses
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'));
const OnboardingAdminPage = lazy(() => import('@/pages/onboarding/OnboardingAdminPage'));
const ExpensePage = lazy(() => import('@/pages/expenses/ExpensePage'));
const ExpenseAdminPage = lazy(() => import('@/pages/expenses/ExpenseAdminPage'));

// Transitions & Assets
const TransitionsPage = lazy(() => import('@/pages/transitions/TransitionsPage'));
const ExitInterviewPage = lazy(() => import('@/pages/transitions/ExitInterviewPage'));
const AssetsPage = lazy(() => import('@/pages/assets/AssetsPage'));

// Leave Admin
const LeaveEnhancementsPage = lazy(() => import('@/pages/leave/LeaveEnhancementsPage'));
const LeaveApprovalsPage = lazy(() => import('@/pages/leave/LeaveApprovalsPage'));
const AdminLeaveBalancesPage = lazy(() => import('@/pages/leave/AdminLeaveBalancesPage'));
const LeavePoliciesPage = lazy(() => import('@/pages/leave/LeavePoliciesPage'));

// Recruitment
const JobPostingsPage = lazy(() => import('@/pages/recruitment/JobPostingsPage'));
const ApplicationsPage = lazy(() => import('@/pages/recruitment/ApplicationsPage'));
const CandidatesPage = lazy(() => import('@/pages/recruitment/CandidatesPage'));
const InterviewsPage = lazy(() => import('@/pages/recruitment/InterviewsPage'));

// Performance
const PerformanceKRAPage = lazy(() => import('@/pages/performance/PerformanceKRAPage'));
const PerformanceReviewsPage = lazy(() => import('@/pages/performance/PerformanceReviewsPage'));
const TeamPerformancePage = lazy(() => import('@/pages/performance/TeamPerformancePage'));
const PerformanceCyclesPage = lazy(() => import('@/pages/performance/PerformanceCyclesPage'));
const AdminOKRsPage = lazy(() => import('@/pages/performance/AdminOKRsPage'));
const AdminReviewsPage = lazy(() => import('@/pages/performance/AdminReviewsPage'));
const CompliancePage = lazy(() => import('@/pages/compliance/CompliancePage'));

export interface RouteConfig {
    path: string;
    element: React.LazyExoticComponent<any> | React.FC;
    permission?: string;
    requireSuperuser?: boolean;
    requireTenantAdmin?: boolean;
    children?: RouteConfig[];
}

export const routes = {
    auth: [
        { path: '/login', element: LoginPage },
        { path: '/forgot-password', element: ForgotPasswordPage },
        { path: '/reset-password/:token', element: ResetPasswordPage },
        { path: '/signup', element: SignupPage },
    ],
    public: [
        { path: '/2fa', element: TwoFactorPage }
    ],
    dashboard: [
        // Superadmin Dashboard (public schema only)
        { path: '/admin/dashboard', element: SuperadminDashboard, requireSuperuser: true },
        
        { path: '/dashboard', element: DashboardPage },
        { path: '/dashboard/manager', element: ManagerDashboard, permission: 'attendance.view_team' },
        { path: '/dashboard/analytics', element: HRAnalyticsDashboard, permission: 'reports.view' },

        // Core Modules
        { path: '/attendance', element: AttendancePage },
        { path: '/leave', element: LeavePage },

        // Employees
        { path: '/employees', element: EmployeesPage, permission: 'employees.view' },
        { path: '/employees/new', element: EmployeeCreatePage, permission: 'employees.create' },
        { path: '/employees/:id', element: EmployeeDetailPage, permission: 'employees.view' },
        { path: '/employees/:id/edit', element: EmployeeEditPage, permission: 'employees.edit' },

        // ABAC (Attribute-Based Access Control)
        { path: '/access-control', element: AbacDashboardPage, permission: 'abac.view' },
        { path: '/access-control/attributes', element: AttributeTypesPage, permission: 'abac.manage' },
        { path: '/access-control/policies', element: PoliciesPage, permission: 'abac.manage' },

        // Legacy RBAC (deprecated - kept for backward compatibility)
        { path: '/rbac/roles', element: RolesPage, permission: 'rbac.view' },
        { path: '/rbac/roles/new', element: RoleCreatePage, permission: 'rbac.create' },
        { path: '/rbac/roles/:id', element: RoleDetailPage, permission: 'rbac.view' },
        { path: '/rbac/roles/:id/edit', element: RoleEditPage, permission: 'rbac.edit' },
        { path: '/rbac/permissions', element: PermissionsPage, permission: 'rbac.view' },

        // Assets
        { path: '/assets', element: AssetsPage, permission: 'assets.view' },

        // Workflows
        { path: '/workflows/approvals', element: ApprovalsPage, permission: 'workflows.view' },
        { path: '/workflows/approvals/:id', element: ApprovalDetailPage, permission: 'workflows.view' },
        { path: '/workflows/history', element: WorkflowHistoryPage, permission: 'workflows.view' },

        // Notifications & Settings
        { path: '/notifications', element: NotificationsPage },
        { path: '/settings', element: SettingsPage },
        { path: '/settings/permissions', element: AccessControlPage },
        { path: '/chat', element: ChatPage },

        // Payroll
        { path: '/payroll/payslips', element: PayslipsPage, permission: 'payroll.view' },
        { path: '/payroll/payslips/:id', element: PayslipDetailPage, permission: 'payroll.view' },
        { path: '/payroll/my-compensation', element: MyCompensationPage },

        // Reports
        { path: '/reports', element: ReportsDashboardPage, permission: 'reports.view' },

        // Billing
        { path: '/billing', element: BillingPage, permission: 'billing.view' },
        { path: '/admin/billing', element: AdminBillingPage, requireSuperuser: true },
        { path: '/admin/plans', element: PlansPage, requireSuperuser: true },
        { path: '/admin/subscriptions', element: SubscriptionsPage, requireSuperuser: true },

        // AI Services (must come before generic admin route)
        { path: '/admin/ai', element: AIServicePage, permission: 'ai.view' },
        { path: '/admin/ai/versions', element: AIServicePage, permission: 'ai.view' },
        { path: '/admin/ai/predictions', element: AIServicePage, permission: 'ai.view' },

        // Onboarding
        { path: '/onboarding', element: OnboardingPage },
        { path: '/onboarding/admin', element: OnboardingAdminPage, permission: 'onboarding.manage' },

        // Expenses
        { path: '/expenses', element: ExpensePage },
        { path: '/expenses/admin', element: ExpenseAdminPage, permission: 'expenses.manage' },

        // Transitions
        { path: '/transitions', element: TransitionsPage, permission: 'employees.transitions' },
        { path: '/exit-interview', element: ExitInterviewPage },

        // Leave Admin
        { path: '/leave/enhancements', element: LeaveEnhancementsPage },
        { path: '/leave/approvals', element: LeaveApprovalsPage, permission: 'leave.manage' },
        { path: '/admin/leave/balances', element: AdminLeaveBalancesPage, permission: 'leave.view_all_balances' },
        { path: '/admin/leave/policies', element: LeavePoliciesPage, permission: 'leave.manage_policies' },

        // Compliance (must come before generic admin route)
        { path: '/admin/compliance', element: CompliancePage, permission: 'compliance.view' },
        { path: '/admin/compliance/retention', element: CompliancePage, permission: 'compliance.view' },
        { path: '/admin/compliance/legal-holds', element: CompliancePage, permission: 'compliance.view' },
        { path: '/admin/compliance/consent', element: CompliancePage, permission: 'compliance.view' },

        // Audit Logs (must come before generic admin route)
        { path: '/admin/core/audit-logs', element: AuditLogsPage, permission: 'core.view' },

        // Integrations (must come before generic admin route)
        { path: '/admin/integrations', element: IntegrationsPage, permission: 'integrations.view' },
        { path: '/admin/integrations/hub', element: IntegrationsPage, permission: 'integrations.view' },
        { path: '/admin/integrations/webhooks', element: IntegrationsPage, permission: 'integrations.view' },
        { path: '/admin/integrations/api-keys', element: IntegrationsPage, permission: 'integrations.view' },

        // Tenant Management (superuser only, public schema)
        { path: '/admin/tenants', element: TenantManagementPage, requireSuperuser: true },

        // Generic Admin (catch-all must come last)
        { path: '/admin/:category/:module', element: AdminModulePage, permission: 'settings.view' },

        // Performance
        { path: '/performance/kras', element: PerformanceKRAPage },
        { path: '/performance/reviews', element: PerformanceReviewsPage, permission: 'performance.view' },
        { path: '/performance/team', element: TeamPerformancePage, permission: 'performance.view' },
        { path: '/performance/admin/cycles', element: PerformanceCyclesPage, permission: 'performance.manage' },
        { path: '/performance/admin/okrs', element: AdminOKRsPage, permission: 'performance.manage' },
        { path: '/performance/admin/reviews', element: AdminReviewsPage, permission: 'performance.manage' },
    ]
};
