/**
 * NotificationBell Component - Header notification dropdown
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationStore } from '@/store/notificationStore'
import NotificationItem from './NotificationItem'

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const {
        notifications,
        unreadCount,
        fetchRecentNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        initializeWebSocket
    } = useNotificationStore()

    // Initial fetch and WebSocket setup
    useEffect(() => {
        fetchRecentNotifications()
        fetchUnreadCount()
        const cleanup = initializeWebSocket()
        return cleanup
    }, [fetchRecentNotifications, fetchUnreadCount, initializeWebSocket])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Refresh when opening
    useEffect(() => {
        if (isOpen) {
            fetchRecentNotifications()
        }
    }, [isOpen, fetchRecentNotifications])

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                        <h3 className="font-semibold text-surface-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-surface-500">
                                <BellIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-100 dark:divide-surface-700">
                                {notifications.slice(0, 5).map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                        compact
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 text-center">
                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

function BellIcon({ className = 'w-5 h-5' }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    )
}
