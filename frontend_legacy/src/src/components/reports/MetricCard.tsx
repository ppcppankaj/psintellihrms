/**
 * MetricCard Component - Display KPI metrics
 */

interface MetricCardProps {
    label: string
    value: string | number
    icon?: React.ReactNode
    trend?: { value: number; isPositive: boolean }
    color?: 'primary' | 'green' | 'amber' | 'red' | 'purple' | 'cyan'
}

const colorClasses = {
    primary: {
        bg: 'bg-primary-50 dark:bg-primary-900/20',
        icon: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
        text: 'text-primary-700 dark:text-primary-300',
    },
    green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
        text: 'text-green-700 dark:text-green-300',
    },
    amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
        text: 'text-amber-700 dark:text-amber-300',
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
        text: 'text-red-700 dark:text-red-300',
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
        text: 'text-purple-700 dark:text-purple-300',
    },
    cyan: {
        bg: 'bg-cyan-50 dark:bg-cyan-900/20',
        icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
        text: 'text-cyan-700 dark:text-cyan-300',
    },
}

export default function MetricCard({ label, value, icon, trend, color = 'primary' }: MetricCardProps) {
    const colors = colorClasses[color]

    return (
        <div className={`${colors.bg} rounded-xl p-4 border border-transparent hover:border-surface-200 dark:hover:border-surface-700 transition-all`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-surface-500">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${colors.text}`}>
                        {value}
                    </p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-1">
                            <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-surface-400">vs last month</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`p-2 rounded-lg ${colors.icon}`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}
