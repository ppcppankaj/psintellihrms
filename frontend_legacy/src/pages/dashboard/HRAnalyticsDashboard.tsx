/**
 * HR Analytics Dashboard - Workforce Metrics and Insights
 */

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
    UsersIcon,
    UserPlusIcon,
    ArrowTrendingUpIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline'
import { employeeService } from '@/services/employeeService'
import { transitionsService } from '@/services/transitionsService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface AnalyticsStat {
    label: string
    value: string | number
    change?: number
    icon: React.ElementType
    color: string
}

export default function HRAnalyticsDashboard() {
    // Fetch workforce stats
    const { data: stats } = useQuery({
        queryKey: ['hr-workforce-stats'],
        queryFn: async () => {
            // This would normally be a dedicated analytics endpoint
            const employees = await employeeService.getEmployees({} as any)
            return {
                totalEmployees: employees.count,
                newJoinees: 12, // Mocked for demo
                turnoverRate: '4.2%',
                avgTenure: '2.5 years'
            }
        },
    })

    // Fetch department distribution
    const { data: departments } = useQuery({
        queryKey: ['hr-departments'],
        queryFn: () => employeeService.getDepartments(),
    })

    // Fetch recent transitions for the feed
    const { data: recentTransitions } = useQuery({
        queryKey: ['hr-recent-transitions'],
        queryFn: () => transitionsService.getTransfers({} as any),
    })

    const isLoading = !stats && !departments && !recentTransitions

    const analyticsStats: AnalyticsStat[] = [
        {
            label: 'Total Employees',
            value: stats?.totalEmployees || 0,
            change: 12,
            icon: UsersIcon,
            color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            label: 'New Hires (Month)',
            value: stats?.newJoinees || 0,
            change: 5,
            icon: UserPlusIcon,
            color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
        },
        {
            label: 'Turnover Rate',
            value: stats?.turnoverRate || '0%',
            change: -2,
            icon: ArrowTrendingUpIcon,
            color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
        },
        {
            label: 'Average Tenure',
            value: stats?.avgTenure || '0y',
            icon: AcademicCapIcon,
            color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    HR Analytics & Insights
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Real-time overview of your workforce health and trends
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {analyticsStats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            {stat.change !== undefined && (
                                <span className={`text-sm font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.change > 0 ? '+' : ''}{stat.change}%
                                </span>
                            )}
                        </div>
                        <h3 className="text-3xl font-bold text-surface-900 dark:text-white">{stat.value}</h3>
                        <p className="text-sm text-surface-500 mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Distribution */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                            Department Distribution
                        </h3>
                        <BuildingOfficeIcon className="w-5 h-5 text-surface-400" />
                    </div>

                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {departments?.map((dept: any) => (
                                <div key={dept.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-surface-700 dark:text-surface-300 font-medium">{dept.name}</span>
                                        <span className="text-surface-500">{dept.employee_count || 0} employees</span>
                                    </div>
                                    <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2">
                                        <div
                                            className="bg-primary-600 h-2 rounded-full"
                                            style={{ width: `${Math.min((dept.employee_count || 0) * 5, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Transitions Feed */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                            Recent Transitions
                        </h3>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-surface-400" />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {((recentTransitions as any) || [])?.slice(0, 5).map((t: any) => (
                                <div key={t.id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                                        <ChartBarIcon className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-surface-900 dark:text-white">
                                            {t.employee_name}
                                        </p>
                                        <p className="text-xs text-surface-500 mt-0.5">
                                            {t.transfer_type_display} · {new Date(t.effective_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                View all transitions
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
