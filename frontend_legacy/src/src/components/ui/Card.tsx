/**
 * Card Component - Container with consistent styling
 */

import { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hover?: boolean
}

interface CardHeaderProps {
    title: string
    subtitle?: string
    action?: ReactNode
    className?: string
}

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
}

export default function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
}: CardProps) {
    return (
        <div
            className={`
        bg-white dark:bg-surface-800
        border border-surface-200 dark:border-surface-700
        rounded-xl shadow-sm
        ${paddingStyles[padding]}
        ${hover ? 'hover:shadow-md hover:border-surface-300 dark:hover:border-surface-600 transition-all' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    )
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
    return (
        <div className={`flex items-start justify-between mb-4 ${className}`}>
            <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={className}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 ${className}`}>
            {children}
        </div>
    )
}

// Stat card for dashboards
export function StatCard({
    label,
    value,
    change,
    changeType = 'neutral',
    icon,
}: {
    label: string
    value: string | number
    change?: string
    changeType?: 'positive' | 'negative' | 'neutral'
    icon?: ReactNode
}) {
    const changeColors = {
        positive: 'text-green-600 dark:text-green-400',
        negative: 'text-red-600 dark:text-red-400',
        neutral: 'text-surface-500 dark:text-surface-400',
    }

    return (
        <Card>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-surface-900 dark:text-white">
                        {value}
                    </p>
                    {change && (
                        <p className={`mt-1 text-sm ${changeColors[changeType]}`}>
                            {change}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    )
}
