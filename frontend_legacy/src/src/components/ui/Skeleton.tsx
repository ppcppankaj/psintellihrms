/**
 * Skeleton Components - Loading placeholders
 */

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-surface-200 dark:bg-surface-700 rounded ${className}`} />
    )
}

// Text skeleton
export function TextSkeleton({ lines = 1, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    )
}

// Avatar skeleton
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    }
    return <Skeleton className={`${sizeClasses[size]} rounded-full`} />
}

// Card skeleton
export function CardSkeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 ${className}`}>
            <div className="flex items-center gap-4">
                <AvatarSkeleton size="lg" />
                <div className="flex-1">
                    <TextSkeleton lines={2} />
                </div>
            </div>
        </div>
    )
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-surface-50 dark:bg-surface-900/50 px-4 py-3 flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-4 py-3 flex items-center gap-4">
                        {Array.from({ length: cols }).map((_, colIndex) => (
                            <Skeleton key={colIndex} className="h-4 flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ))}
            <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
    )
}

// Dashboard skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Metric cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
                <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
            </div>
        </div>
    )
}

// List skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}

// Profile skeleton
export function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-6">
                <AvatarSkeleton size="xl" />
                <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                ))}
            </div>
        </div>
    )
}
