/**
 * Chat Service - API calls for chat functionality
 */
import { api } from './api';
import { useAuthStore } from '../store/authStore';

export interface Conversation {
    id: string;
    type: 'direct' | 'group' | 'department' | 'announcement';
    name: string | null;
    description: string | null;
    last_message_at: string;
    last_message: {
        content: string;
        sender_name: string;
        created_at: string;
    } | null;
    unread_count: number;
    participants_preview: UserMini[];
}

export interface UserMini {
    id: string;
    email: string;
    full_name: string;
    avatar: string | null;
}

export interface Message {
    id: string;
    conversation: string;
    sender: UserMini;
    content: string;
    attachment: string | null;
    is_system_message: boolean;
    reply_to: string | null;
    reactions_summary: Record<string, number>;
    created_at: string;
    updated_at: string;
}

export const chatService = {
    // Conversations
    async getConversations(): Promise<Conversation[]> {
        // Superusers in public schema have no tenant context; skip chat entirely
        const { user, tenant, tokens } = useAuthStore.getState();
        // If we don't yet have a user (bootstrap), avoid firing tenant-scoped calls
        if (!user) {
            return [];
        }

        // Any superuser should skip chat unless explicitly revisited later with a tenant-scoped identity
        if (user.is_superuser) {
            return [];
        }

        // Superuser/public handled above; skip if no token
        if (!tokens?.access) {
            return [];
        }
        try {
            const response = await api.get('/chat/conversations/');
            return response.data.results || response.data;
        } catch (err: any) {
            const status = err?.response?.status;
            const code = err?.response?.data?.error?.code || err?.response?.data?.error?.details?.code;
            // If the user does not exist in this tenant/schema, return empty rather than spamming 401s
            if (status === 401 && (user?.is_superuser || code === 'user_not_found')) {
                return [];
            }
            throw err;
        }
    },

    async getConversation(id: string): Promise<Conversation> {
        const response = await api.get(`/chat/conversations/${id}/`);
        return response.data;
    },

    async startDirectChat(userId: string, initialMessage?: string): Promise<Conversation> {
        const response = await api.post('/chat/conversations/start-direct/', {
            user_id: userId,
            initial_message: initialMessage,
        });
        return response.data;
    },

    async createGroupChat(name: string, userIds: string[], description?: string): Promise<Conversation> {
        const response = await api.post('/chat/conversations/create-group/', {
            name,
            user_ids: userIds,
            description,
        });
        return response.data;
    },

    async markAsRead(conversationId: string): Promise<void> {
        await api.post(`/chat/conversations/${conversationId}/mark_read/`);
    },

    async muteConversation(conversationId: string): Promise<{ is_muted: boolean }> {
        const response = await api.post(`/chat/conversations/${conversationId}/mute/`);
        return response.data;
    },

    // Messages
    async getMessages(conversationId: string): Promise<Message[]> {
        const response = await api.get('/chat/messages/', {
            params: { conversation: conversationId },
        });
        return response.data.results || response.data;
    },

    async sendMessage(conversationId: string, content: string, replyToId?: string): Promise<Message> {
        const response = await api.post('/chat/messages/', {
            conversation: conversationId,
            content,
            reply_to_id: replyToId,
        });
        return response.data;
    },

    async reactToMessage(messageId: string, reaction: string): Promise<void> {
        await api.post(`/chat/messages/${messageId}/react/`, { reaction });
    },

    async deleteMessage(messageId: string): Promise<void> {
        await api.delete(`/chat/messages/${messageId}/`);
    },
};
