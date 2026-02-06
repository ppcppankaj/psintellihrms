/**
 * ReportsDashboardPage - Analytics dashboard with charts and metrics
 */

import { useEffect } from 'react'
import { useReportsStore } from '@/store/reportsStore'
import MetricCard from '@/components/reports/MetricCard'
import ChartCard, { SimpleBarChart, ProgressRing } from '@/components/reports/ChartCard'
import Card, { CardContent } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ReportsDashboardPage() {
    const {
        metrics,
        departmentStats,
        leaveStats,
        isLoadingMetrics,
        isLoadingStats,
        fetchDashboardMetrics,
        fetchDepartmentStats,
        fetchLeaveStats,
        exportData
    } = useReportsStore()

    useEffect(() => {
        fetchDashboardMetrics()
        fetchDepartmentStats()
        fetchLeaveStats()
    }, [fetchDashboardMetrics, fetchDepartmentStats, fetchLeaveStats])

    const handleExport = async (type: string, format: 'xlsx' | 'csv') => {
        await exportData(type, format)
    }

    if (isLoadingMetrics) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Reports & Analytics
                    </h1>
                    <p className="text-surface-500 mt-1">
                        Organization insights and metrics
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('summary', 'xlsx')}
                        className="px-4 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                    >
                        Export Excel
                    </button>
                    <button
                        onClick={() => handleExport('summary', 'csv')}
                        className="px-4 py-2 text-sm border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Total Employees"
                        value={metrics.total_employees}
                        icon={<UsersIcon />}
                        color="primary"
                    />
                    <MetricCard
                        label="Active Employees"
                        value={metrics.active_employees}
                        icon={<UserCheckIcon />}
                        color="green"
                    />
                    <MetricCard
                        label="On Leave Today"
                        value={metrics.on_leave_today}
                        icon={<CalendarIcon />}
                        color="amber"
                    />
                    <MetricCard
                        label="Pending Approvals"
                        value={metrics.pending_approvals}
                        icon={<ClockIcon />}
                        color="purple"
                    />
                </div>
            )}

            {/* Second Row Metrics */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="New Hires (This Month)"
                        value={metrics.new_hires_this_month}
                        trend={{ value: 12, isPositive: true }}
                        color="green"
                    />
                    <MetricCard
                        label="Attrition (This Month)"
                        value={metrics.attrition_this_month}
                        trend={{ value: 5, isPositive: false }}
                        color="red"
                    />
                    <MetricCard
                        label="Avg Attendance"
                        value={`${metrics.avg_attendance_percent}%`}
                        color="cyan"
                    />
                    <MetricCard
                        label="Open Positions"
                        value={metrics.open_positions}
                        color="primary"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Stats */}
                <ChartCard title="Department Breakdown" subtitle="Employee distribution by department">
                    {isLoadingStats ? (
                        <div className="h-48 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : departmentStats.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <SimpleBarChart
                            data={departmentStats.map(d => ({
                                label: d.department,
                                value: d.employee_count,
                                color: 'bg-primary-500'
                            }))}
                        />
                    )}
                </ChartCard>

                {/* Leave Utilization */}
                <ChartCard title="Leave Utilization" subtitle="Leave usage by type">
                    {!leaveStats || leaveStats.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <div className="flex flex-wrap justify-center gap-6">
                            {(Array.isArray(leaveStats) ? leaveStats : []).slice(0, 4).map((stat, index) => (
                                <ProgressRing
                                    key={index}
                                    value={stat.utilization_percent}
                                    label={stat.leave_type}
                                    color={['primary', 'green', 'amber', 'purple'][index] as any}
                                />
                            ))}
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Attrition by Department */}
            <ChartCard
                title="Attrition by Department"
                subtitle="Monthly attrition rates"
                actions={
                    <select className="text-sm px-2 py-1 rounded border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800">
                        <option>Last 6 months</option>
                        <option>Last 12 months</option>
                        <option>This year</option>
                    </select>
                }
            >
                {departmentStats.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <SimpleBarChart
                        data={departmentStats.map(d => ({
                            label: d.department,
                            value: d.attrition_rate,
                            color: d.attrition_rate > 10 ? 'bg-red-500' : d.attrition_rate > 5 ? 'bg-amber-500' : 'bg-green-500'
                        }))}
                        maxValue={20}
                    />
                )}
            </ChartCard>
        </div>
    )
}

function EmptyChart() {
    return (
        <Card padding="none">
            <CardContent className="text-center py-8">
                <ChartIcon className="mx-auto h-10 w-10 text-surface-400" />
                <p className="text-sm text-surface-500 mt-2">No data available</p>
            </CardContent>
        </Card>
    )
}

// Icons
function UsersIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    )
}

function UserCheckIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    )
}

function CalendarIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    )
}

function ClockIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}

function ChartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    )
}
