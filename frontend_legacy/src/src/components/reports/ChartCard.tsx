/**
 * ChartCard Component - Container for chart visualizations
 */

import Card, { CardHeader, CardContent } from '@/components/ui/Card'

interface ChartCardProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    actions?: React.ReactNode
}

export default function ChartCard({ title, subtitle, children, actions }: ChartCardProps) {
    return (
        <Card>
            <CardHeader title={title} subtitle={subtitle} action={actions} />
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}

// Simple bar chart using CSS
interface SimpleBarChartProps {
    data: { label: string; value: number; color?: string }[]
    maxValue?: number
}

export function SimpleBarChart({ data, maxValue }: SimpleBarChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-surface-500 text-sm text-center py-4">No data available</div>
    }
    const max = maxValue || Math.max(...data.map(d => d.value)) || 1

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-surface-600 dark:text-surface-400">{item.label}</span>
                        <span className="font-medium text-surface-900 dark:text-white">{item.value}</span>
                    </div>
                    <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${item.color || 'bg-primary-500'}`}
                            style={{ width: `${(item.value / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

// Simple donut/progress indicator
interface ProgressRingProps {
    value: number
    label: string
    color?: string
    size?: 'sm' | 'md' | 'lg'
}

export function ProgressRing({ value, label, color = 'primary', size = 'md' }: ProgressRingProps) {
    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
    }

    const strokeWidth = size === 'sm' ? 6 : size === 'md' ? 8 : 10
    const radius = size === 'sm' ? 28 : size === 'md' ? 44 : 58
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference

    const colorMap: Record<string, string> = {
        primary: 'stroke-primary-500',
        green: 'stroke-green-500',
        amber: 'stroke-amber-500',
        red: 'stroke-red-500',
    }

    return (
        <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-surface-200 dark:text-surface-700"
                />
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={colorMap[color] || colorMap.primary}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-surface-900 dark:text-white">{value}%</span>
                <span className="text-xs text-surface-500">{label}</span>
            </div>
        </div>
    )
}

// Simple mini chart (sparkline-like)
interface MiniChartProps {
    data: number[]
    color?: string
}

export function MiniChart({ data, color = 'primary' }: MiniChartProps) {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const colorMap: Record<string, string> = {
        primary: 'bg-primary-500',
        green: 'bg-green-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
    }

    return (
        <div className="flex items-end gap-0.5 h-8">
            {data.map((value, index) => (
                <div
                    key={index}
                    className={`flex-1 rounded-t ${colorMap[color]}`}
                    style={{ height: `${((value - min) / range) * 100}%`, minHeight: '4px' }}
                />
            ))}
        </div>
    )
}
