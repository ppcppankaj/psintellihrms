/**
 * Notification Service - API for notifications and templates
 */
import api from './index';

export interface Notification {
    id: string;
    recipient: string;
    template?: string;
    channel: string;
    subject: string;
    body: string;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    sent_at?: string;
    read_at?: string;
    entity_type?: string;
    entity_id?: string;
    created_at: string;
}

export interface NotificationTemplate {
    id: string;
    name: string;
    code: string;
    subject: string;
    body: string;
    channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'slack' | 'teams';
    variables: string[];
    is_active?: boolean;
}

export interface NotificationPreference {
    id: string;
    email_enabled: boolean;
    push_enabled: boolean;
    sms_enabled: boolean;
    leave_notifications: boolean;
    attendance_notifications: boolean;
    payroll_notifications: boolean;
    task_notifications: boolean;
    announcement_notifications: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
}

export const notificationService = {
    // User notifications
    getNotifications: async (page: number = 1) => {
        const response = await api.get('/notifications/notifications/', { params: { page } });
        return response.data;
    },

    markAsRead: async (notificationId: string) => {
        const response = await api.post(`/notifications/notifications/${notificationId}/read/`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.post('/notifications/notifications/read-all/');
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get('/notifications/notifications/unread-count/');
        return response.data;
    },

    // Notification templates (Admin)
    getTemplates: async () => {
        const response = await api.get('/notifications/templates/');
        return response.data;
    },

    getTemplate: async (id: string) => {
        const response = await api.get(`/notifications/templates/${id}/`);
        return response.data;
    },

    createTemplate: async (data: Partial<NotificationTemplate>) => {
        const response = await api.post('/notifications/templates/', data);
        return response.data;
    },

    updateTemplate: async (id: string, data: Partial<NotificationTemplate>) => {
        const response = await api.put(`/notifications/templates/${id}/`, data);
        return response.data;
    },

    deleteTemplate: async (id: string) => {
        const response = await api.delete(`/notifications/templates/${id}/`);
        return response.data;
    },

    // User preferences
    getPreferences: async () => {
        const response = await api.get('/notifications/preferences/me/');
        return response.data;
    },

    updatePreferences: async (data: Partial<NotificationPreference>) => {
        const response = await api.patch('/notifications/preferences/me/', data);
        return response.data;
    }
};

export default notificationService;
