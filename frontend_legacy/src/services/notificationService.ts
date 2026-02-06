/**
 * Notification Service - API calls for notifications
 */

import { api } from './api'

// Types
export interface Notification {
    id: string
    type: 'info' | 'success' | 'warning' | 'error' | 'approval' | 'leave' | 'attendance' | 'announcement'
    title: string
    message: string
    is_read: boolean
    action_url?: string
    metadata?: Record<string, any>
    created_at: string
}

export interface NotificationPreferences {
    email_enabled: boolean
    push_enabled: boolean
    sms_enabled: boolean
    categories: {
        leave: boolean
        attendance: boolean
        approvals: boolean
        announcements: boolean
        system: boolean
    }
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

class NotificationService {
    private basePath = '/notifications'

    // Get all notifications
    async getNotifications(params?: { page?: number; is_read?: boolean }): Promise<PaginatedResponse<Notification>> {
        const response = await api.get<PaginatedResponse<Notification>>(`${this.basePath}/`, { params })
        return response.data
    }

    // Get unread count
    async getUnreadCount(): Promise<number> {
        const response = await api.get<{ unread_count: number }>(`${this.basePath}/unread-count/`)
        return response.data.unread_count
    }

    // Get recent notifications (for dropdown)
    async getRecentNotifications(limit: number = 5): Promise<Notification[]> {
        const response = await api.get<PaginatedResponse<Notification>>(`${this.basePath}/`, {
            params: { page_size: limit }
        })
        return response.data.results || response.data
    }

    // Mark single notification as read
    async markAsRead(id: string): Promise<Notification> {
        const response = await api.patch<Notification>(`${this.basePath}/${id}/`, { is_read: true })
        return response.data
    }

    // Mark all notifications as read
    async markAllAsRead(): Promise<void> {
        await api.post(`${this.basePath}/read-all/`)
    }

    // Delete notification
    async deleteNotification(id: string): Promise<void> {
        await api.delete(`${this.basePath}/${id}/`)
    }

    // Get preferences
    async getPreferences(): Promise<NotificationPreferences> {
        const response = await api.get<NotificationPreferences>(`${this.basePath}/preferences/me/`)
        return response.data
    }

    // Update preferences
    async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
        const response = await api.patch<NotificationPreferences>(`${this.basePath}/preferences/me/`, prefs)
        return response.data
    }
}

export const notificationService = new NotificationService()

// Mock WebSocket for real-time updates
export class NotificationWebSocket {
    private callbacks: Set<(notification: Notification) => void> = new Set()
    private mockInterval: number | null = null

    connect() {
        // In production, this would connect to actual WebSocket
        // For now, simulate with polling or mock events
    }

    disconnect() {
        if (this.mockInterval) {
            clearInterval(this.mockInterval)
            this.mockInterval = null
        }
    }

    onNotification(callback: (notification: Notification) => void) {
        this.callbacks.add(callback)
        return () => this.callbacks.delete(callback)
    }

    // For simulating new notifications in dev
    simulateNotification(notification: Notification) {
        this.callbacks.forEach(cb => cb(notification))
    }
}

export const notificationSocket = new NotificationWebSocket()
