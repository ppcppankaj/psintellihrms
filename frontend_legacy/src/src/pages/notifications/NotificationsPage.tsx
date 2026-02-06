/**
 * NotificationsPage - Full notifications list with filters
 */

import { useEffect, useState } from 'react'
import { useNotificationStore } from '@/store/notificationStore'
import NotificationItem from '@/components/notifications/NotificationItem'
import Card, { CardContent } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NotificationsPage() {
    const {
        notifications,
        totalCount,
        currentPage,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotificationStore()

    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    useEffect(() => {
        fetchNotifications({
            page: 1,
            is_read: filter === 'unread' ? false : undefined
        })
    }, [fetchNotifications, filter])

    const handlePageChange = (page: number) => {
        fetchNotifications({
            page,
            is_read: filter === 'unread' ? false : undefined
        })
    }

    const totalPages = Math.ceil(totalCount / 20)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Notifications
                    </h1>
                    <p className="text-surface-500 mt-1">
                        Stay updated with your latest notifications
                    </p>
                </div>
                <button
                    onClick={() => markAllAsRead()}
                    className="px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                    Mark all as read
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${filter === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${filter === 'unread'
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                        }`}
                >
                    Unread
                </button>
            </div>

            {/* Notifications List */}
            {isLoading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <LoadingSpinner size="lg" />
                </div>
            ) : !notifications || notifications.length === 0 ? (
                <EmptyState filter={filter} />
            ) : (
                <Card padding="none">
                    <div className="divide-y divide-surface-100 dark:divide-surface-700">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                                onDelete={deleteNotification}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
                            <p className="text-sm text-surface-500">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm rounded border border-surface-300 dark:border-surface-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 dark:hover:bg-surface-700"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm rounded border border-surface-300 dark:border-surface-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 dark:hover:bg-surface-700"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}

function EmptyState({ filter }: { filter: string }) {
    return (
        <Card>
            <CardContent className="text-center py-12">
                <BellIcon className="mx-auto h-12 w-12 text-surface-400" />
                <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
                    {filter === 'unread' ? 'All caught up!' : 'No notifications'}
                </h3>
                <p className="mt-1 text-sm text-surface-500">
                    {filter === 'unread'
                        ? 'You have no unread notifications.'
                        : 'Notifications will appear here.'}
                </p>
            </CardContent>
        </Card>
    )
}

function BellIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    )
}
