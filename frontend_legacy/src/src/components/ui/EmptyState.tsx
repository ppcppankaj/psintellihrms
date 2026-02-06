/**
 * EmptyState - Display when no data is available
 */

import { ReactNode } from 'react'

interface EmptyStateProps {
    icon?: ReactNode
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`text-center py-12 px-4 ${className}`}>
            {icon ? (
                <div className="mx-auto mb-4">{icon}</div>
            ) : (
                <DefaultIcon />
            )}
            <h3 className="text-lg font-medium text-surface-900 dark:text-white">
                {title}
            </h3>
            {description && (
                <p className="mt-2 text-sm text-surface-500 max-w-sm mx-auto">
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    )
}

function DefaultIcon() {
    return (
        <svg
            className="mx-auto h-12 w-12 text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
        </svg>
    )
}

// Preset empty states for common scenarios
export function NoDataEmptyState({ onRefresh }: { onRefresh?: () => void }) {
    return (
        <EmptyState
            title="No data found"
            description="There's nothing to display at the moment."
            action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
        />
    )
}

export function NoSearchResultsEmptyState({ query, onClear }: { query: string; onClear: () => void }) {
    return (
        <EmptyState
            icon={<SearchIcon />}
            title={`No results for "${query}"`}
            description="Try adjusting your search or filters to find what you're looking for."
            action={{ label: 'Clear search', onClick: onClear }}
        />
    )
}

export function NoPermissionEmptyState() {
    return (
        <EmptyState
            icon={<LockIcon />}
            title="Access Denied"
            description="You don't have permission to view this content. Contact your administrator if you believe this is an error."
        />
    )
}

export function ErrorEmptyState({ onRetry }: { onRetry: () => void }) {
    return (
        <EmptyState
            icon={<ErrorIcon />}
            title="Something went wrong"
            description="We couldn't load the data. Please try again."
            action={{ label: 'Retry', onClick: onRetry }}
        />
    )
}

// Icons
function SearchIcon() {
    return (
        <svg className="mx-auto h-12 w-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    )
}

function LockIcon() {
    return (
        <svg className="mx-auto h-12 w-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    )
}

function ErrorIcon() {
    return (
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    )
}
