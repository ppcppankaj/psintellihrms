/**
 * Notification Store - Zustand state management
 */

import { create } from 'zustand'
import {
    notificationService,
    notificationSocket,
    Notification,
    NotificationPreferences
} from '@/services/notificationService'

interface NotificationState {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    totalCount: number
    currentPage: number

    preferences: NotificationPreferences | null
    isLoadingPreferences: boolean

    // Actions
    fetchNotifications: (params?: { page?: number; is_read?: boolean }) => Promise<void>
    fetchUnreadCount: () => Promise<void>
    fetchRecentNotifications: () => Promise<void>
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    deleteNotification: (id: string) => Promise<void>
    fetchPreferences: () => Promise<void>
    updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>
    addNotification: (notification: Notification) => void
    initializeWebSocket: () => () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    totalCount: 0,
    currentPage: 1,

    preferences: null,
    isLoadingPreferences: false,

    fetchNotifications: async (params) => {
        set({ isLoading: true })
        try {
            const response = await notificationService.getNotifications(params)
            set({
                notifications: response.results,
                totalCount: response.count,
                currentPage: params?.page || 1,
                isLoading: false
            })
        } catch {
            set({ isLoading: false })
        }
    },

    fetchUnreadCount: async () => {
        try {
            const count = await notificationService.getUnreadCount()
            set({ unreadCount: count })
        } catch {
            // Silently fail
        }
    },

    fetchRecentNotifications: async () => {
        try {
            const notifications = await notificationService.getRecentNotifications(5)
            set({ notifications })
        } catch {
            // Silently fail
        }
    },

    markAsRead: async (id: string) => {
        try {
            const updated = await notificationService.markAsRead(id)
            set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? updated : n),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }))
        } catch {
            // Silently fail
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationService.markAllAsRead()
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0
            }))
        } catch {
            // Silently fail
        }
    },

    deleteNotification: async (id: string) => {
        try {
            await notificationService.deleteNotification(id)
            set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id),
                totalCount: state.totalCount - 1
            }))
        } catch {
            // Silently fail
        }
    },

    fetchPreferences: async () => {
        set({ isLoadingPreferences: true })
        try {
            const preferences = await notificationService.getPreferences()
            set({ preferences, isLoadingPreferences: false })
        } catch {
            set({ isLoadingPreferences: false })
        }
    },

    updatePreferences: async (prefs) => {
        const updated = await notificationService.updatePreferences(prefs)
        set({ preferences: updated })
    },

    addNotification: (notification: Notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
        }))
    },

    initializeWebSocket: () => {
        notificationSocket.connect()
        const unsubscribe = notificationSocket.onNotification((notification) => {
            get().addNotification(notification)
        })

        return () => {
            unsubscribe()
            notificationSocket.disconnect()
        }
    },
}))
