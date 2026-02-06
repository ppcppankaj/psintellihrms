
import {
    ArrowPathIcon,
    BriefcaseIcon,
    CalendarIcon,
    ChartBarIcon,
    ClockIcon,
    Cog6ToothIcon,
    CommandLineIcon,
    CpuChipIcon,
    CreditCardIcon,
    CurrencyDollarIcon,
    DocumentChartBarIcon,
    HomeIcon,
    LinkIcon,
    ScaleIcon,
    ShieldCheckIcon,
    UsersIcon,
} from '@heroicons/react/24/outline'

export interface NavItem {
    name: string
    href: string
    icon?: any
    permission?: string | null
    children?: NavItem[]
}

export interface NavGroup {
    title: string
    items: NavItem[]
}

export const navigationConfig: NavGroup[] = [
    {
        title: 'Core',
        items: [
            { name: 'My Dashboard', href: '/dashboard', icon: HomeIcon, permission: null },
            { name: 'Team Portal', href: '/dashboard/manager', icon: UsersIcon, permission: 'attendance.view_team' },
            { name: 'HR Analytics', href: '/dashboard/analytics', icon: ChartBarIcon, permission: 'reports.view' },
            { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon, permission: 'reports.view' },
        ]
    },
    {
        title: 'Workforce',
        items: [
            {
                name: 'Employees',
                href: '/employees',
                icon: UsersIcon,
                permission: 'employees.view',
                children: [
                    { name: 'Directory', href: '/employees' },
                    { name: 'Departments', href: '/admin/employees/departments' },
                    { name: 'Designations', href: '/admin/employees/designations' },
                    { name: 'Locations', href: '/admin/employees/locations' },
                    { name: 'Skills', href: '/admin/employees/skills' },
                ]
            },
            {
                name: 'Attendance',
                href: '/attendance',
                icon: ClockIcon,
                permission: 'attendance.view',
                children: [
                    { name: 'My Attendance', href: '/attendance' },
                    { name: 'Logs', href: '/admin/attendance/punches' },
                    { name: 'Shifts', href: '/admin/attendance/shifts' },
                    { name: 'Geofences', href: '/admin/attendance/geofences' },
                ]
            },
            {
                name: 'Leave',
                href: '/leave',
                icon: CalendarIcon,
                permission: 'leave.view',
                children: [
                    { name: 'My Leave', href: '/leave' },
                    { name: 'Enhancements', href: '/leave/enhancements' },
                    { name: 'Approvals', href: '/leave/approvals', permission: 'leave.manage' },
                    { name: 'Team Leaves', href: '/dashboard/manager', permission: 'leave.view_team' },
                    { name: 'All Balances', href: '/admin/leave/balances', permission: 'leave.view_all_balances' },
                    { name: 'Leave Types', href: '/admin/leave/types', permission: 'leave.manage_types' },
                    { name: 'Policies', href: '/admin/leave/policies', permission: 'leave.manage_policies' },
                ]
            },
            {
                name: 'Transitions',
                href: '/transitions',
                icon: ArrowPathIcon,
                permission: 'employees.transitions',
            },
            {
                name: 'Assets',
                href: '/assets',
                icon: BriefcaseIcon,
                permission: 'assets.view',
            },
        ]
    },
    {
        title: 'Financials',
        items: [
            {
                name: 'Payroll',
                href: '/payroll',
                icon: CurrencyDollarIcon,
                permission: 'payroll.view',
                children: [
                    { name: 'Payslips', href: '/payroll/payslips' },
                    { name: 'Payroll Runs', href: '/admin/payroll/runs' },
                    { name: 'Tax Declarations', href: '/admin/payroll/tax-declarations' },
                ]
            },
            {
                name: 'Billing',
                href: '/billing',
                icon: CreditCardIcon,
                permission: 'billing.view', // General permission
                children: [
                    { name: 'My Subscription', href: '/billing' },
                    { name: 'Admin Console', href: '/admin/billing', permission: 'billing.manage' },
                ]
            },
        ]
    },
    {
        title: 'Operations',
        items: [
            {
                name: 'Recruitment',
                href: '/recruitment',
                icon: BriefcaseIcon,
                permission: 'recruitment.view',
                children: [
                    { name: 'Job Postings', href: '/recruitment/jobs' },
                    { name: 'Applications', href: '/recruitment/applications' },
                    { name: 'Candidates', href: '/recruitment/candidates' },
                    { name: 'Interviews', href: '/recruitment/interviews' },
                ]
            },
            {
                name: 'Performance',
                href: '/performance/kras',
                icon: DocumentChartBarIcon,
                permission: 'performance.view',
                children: [
                    { name: 'My KRAs', href: '/performance/kras' },
                    { name: 'My Reviews', href: '/performance/reviews' },
                    { name: 'Team Performance', href: '/performance/team', permission: 'performance.view' },
                    { name: 'Manage Cycles', href: '/performance/admin/cycles', permission: 'performance.manage' },
                    { name: 'All OKRs', href: '/performance/admin/okrs', permission: 'performance.view_all' },
                    { name: 'All Reviews', href: '/performance/admin/reviews', permission: 'performance.view_all' },
                ]
            },
            {
                name: 'Workflows',
                href: '/workflows/history',
                icon: ArrowPathIcon,
                permission: 'workflows.view',
                children: [
                    { name: 'Definitions', href: '/admin/workflows/definitions' },
                    { name: 'Instances', href: '/admin/workflows/instances' },
                    { name: 'Steps', href: '/admin/workflows/steps' },
                ]
            },
        ]
    },
    {
        title: 'Intelligence',
        items: [
            {
                name: 'AI Services',
                href: '/admin/ai',
                icon: CpuChipIcon,
                permission: 'ai.view',
            },
        ]
    },
    {
        title: 'Governance',
        items: [
            {
                name: 'Access Control',
                href: '/access-control',
                icon: ShieldCheckIcon,
                permission: 'abac.view',
                children: [
                    { name: 'Dashboard', href: '/access-control' },
                    { name: 'Attributes', href: '/access-control/attributes', permission: 'abac.manage' },
                    { name: 'Policies', href: '/access-control/policies', permission: 'abac.manage' },
                    { name: 'Legacy RBAC', href: '/rbac/roles', permission: 'rbac.view' },
                ]
            },
            {
                name: 'Compliance',
                href: '/admin/compliance',
                icon: ScaleIcon,
                permission: 'compliance.view',
            },
            {
                name: 'Audit Logs',
                href: '/admin/core/audit-logs',
                icon: CommandLineIcon,
                permission: 'core.view',
            },
        ]
    },
    {
        title: 'System',
        items: [
            {
                name: 'Integrations',
                href: '/admin/integrations',
                icon: LinkIcon,
                permission: 'integrations.view',
            },
            {
                name: 'System Settings',
                href: '/settings',
                icon: Cog6ToothIcon,
                permission: 'settings.view',
                children: [
                    { name: 'General', href: '/settings' },
                    { name: 'Notifications', href: '/admin/notifications/templates' },
                    { name: 'Feature Flags', href: '/admin/core/feature-flags' },
                ]
            },
        ]
    },
    {
        title: 'Administration',
        items: [
            {
                name: 'Tenant Management',
                href: '/admin/tenants',
                icon: ShieldCheckIcon,
                permission: 'admin.manage_tenants',
            },
        ]
    }
]

// Superuser-only navigation (public schema)
export const superuserNavigation: NavGroup[] = [
    {
        title: 'Superadmin',
        items: [
            {
                name: 'Dashboard',
                href: '/admin/dashboard',
                icon: HomeIcon,
                permission: null,
            },
            {
                name: 'Manage Tenants',
                href: '/admin/tenants',
                icon: ShieldCheckIcon,
                permission: null,
            },
            {
                name: 'Billing & Plans',
                href: '/admin/billing',
                icon: CreditCardIcon,
                permission: null,
            },
            {
                name: 'Settings',
                href: '/settings',
                icon: Cog6ToothIcon,
                permission: null,
            },
        ]
    }
]
