/**
 * NotificationItem Component - Single notification display
 */

import { Notification } from '@/services/notificationService'

interface NotificationItemProps {
    notification: Notification
    onMarkAsRead?: (id: string) => void
    onDelete?: (id: string) => void
    compact?: boolean
}

const typeIcons: Record<string, { bg: string; icon: React.ReactNode }> = {
    info: {
        bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        icon: <InfoIcon />
    },
    success: {
        bg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        icon: <CheckIcon />
    },
    warning: {
        bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        icon: <WarningIcon />
    },
    error: {
        bg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        icon: <ErrorIcon />
    },
    approval: {
        bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        icon: <ApprovalIcon />
    },
    leave: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
        icon: <LeaveIcon />
    },
    attendance: {
        bg: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
        icon: <AttendanceIcon />
    },
    announcement: {
        bg: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
        icon: <AnnouncementIcon />
    },
}

export default function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
    compact = false
}: NotificationItemProps) {
    const typeConfig = typeIcons[notification.type] || typeIcons.info

    const handleClick = () => {
        if (!notification.is_read && onMarkAsRead) {
            onMarkAsRead(notification.id)
        }
        if (notification.action_url) {
            window.location.href = notification.action_url
        }
    }

    return (
        <div
            onClick={handleClick}
            className={`
        flex gap-3 p-3 rounded-lg transition-colors cursor-pointer
        ${notification.is_read
                    ? 'bg-transparent hover:bg-surface-50 dark:hover:bg-surface-700/50'
                    : 'bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }
      `}
        >
            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${typeConfig.bg}`}>
                {typeConfig.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${notification.is_read ? 'text-surface-600 dark:text-surface-400' : 'text-surface-900 dark:text-white font-medium'}`}>
                        {notification.title}
                    </p>
                    {!compact && !notification.is_read && (
                        <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary-500" />
                    )}
                </div>

                {!compact && (
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                        {notification.message}
                    </p>
                )}

                <p className="text-xs text-surface-400 mt-1">
                    {formatTimeAgo(notification.created_at)}
                </p>
            </div>

            {/* Actions */}
            {!compact && onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(notification.id)
                    }}
                    className="flex-shrink-0 p-1 text-surface-400 hover:text-red-500 transition-colors"
                >
                    <DeleteIcon />
                </button>
            )}
        </div>
    )
}

// Icons
function InfoIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    )
}

function WarningIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    )
}

function ErrorIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
    )
}

function ApprovalIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    )
}

function LeaveIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    )
}

function AttendanceIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}

function AnnouncementIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
    )
}

function DeleteIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
}

function formatTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
}
