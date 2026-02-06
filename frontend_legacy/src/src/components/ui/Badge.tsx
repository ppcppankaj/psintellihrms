/**
 * Badge Component - Status indicators
 */

import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
    children: ReactNode
    variant?: BadgeVariant
    size?: BadgeSize
    dot?: boolean
    className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
}

const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
}

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-surface-400',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    primary: 'bg-primary-500',
}

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    className = '',
}: BadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
            )}
            {children}
        </span>
    )
}

// Preset badges for employee status
export function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
        active: { label: 'Active', variant: 'success' },
        probation: { label: 'Probation', variant: 'warning' },
        notice_period: { label: 'Notice Period', variant: 'warning' },
        inactive: { label: 'Inactive', variant: 'default' },
        terminated: { label: 'Terminated', variant: 'error' },
    }

    const config = statusConfig[status] || { label: status, variant: 'default' }

    return (
        <Badge variant={config.variant} dot>
            {config.label}
        </Badge>
    )
}
