/**
 * Chat Service - API for conversations and messages
 */
import api from './index';

export interface Conversation {
    id: string;
    type: 'direct' | 'group' | 'department' | 'announcement';
    name: string | null;
    description: string | null;
    last_message_at: string;
    participants: ConversationParticipant[];
    unread_count?: number;
    last_message?: Message;
}

export interface ConversationParticipant {
    id: string;
    user: string;
    user_name?: string;
    role: 'admin' | 'member';
    joined_at: string;
    is_muted: boolean;
}

export interface Message {
    id: string;
    conversation: string;
    sender: string;
    sender_name?: string;
    content: string;
    attachment?: string;
    is_system_message: boolean;
    reply_to?: string;
    reactions: MessageReaction[];
    created_at: string;
}

export interface MessageReaction {
    id: string;
    user: string;
    reaction: string;
}

export const chatService = {
    // Conversations
    getConversations: async () => {
        const response = await api.get('/chat/conversations/');
        return response.data;
    },

    getConversation: async (id: string) => {
        const response = await api.get(`/chat/conversations/${id}/`);
        return response.data;
    },

    startDirectConversation: async (userId: string) => {
        const response = await api.post('/chat/conversations/start-direct/', { user_id: userId });
        return response.data;
    },

    createGroupConversation: async (data: { name: string; description?: string; participant_ids: string[] }) => {
        const response = await api.post('/chat/conversations/create-group/', data);
        return response.data;
    },

    markAsRead: async (conversationId: string) => {
        const response = await api.post(`/chat/conversations/${conversationId}/mark_read/`);
        return response.data;
    },

    muteConversation: async (conversationId: string, mute: boolean) => {
        const response = await api.post(`/chat/conversations/${conversationId}/mute/`, { mute });
        return response.data;
    },

    // Messages
    getMessages: async (conversationId: string, page: number = 1) => {
        const response = await api.get('/chat/messages/', {
            params: { conversation: conversationId, page }
        });
        return response.data;
    },

    sendMessage: async (data: { conversation: string; content: string; reply_to?: string }) => {
        const response = await api.post('/chat/messages/', data);
        return response.data;
    },

    sendMessageWithAttachment: async (data: FormData) => {
        const response = await api.post('/chat/messages/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    addReaction: async (messageId: string, reaction: string) => {
        const response = await api.post(`/chat/messages/${messageId}/react/`, { reaction });
        return response.data;
    },

    deleteMessage: async (messageId: string) => {
        const response = await api.delete(`/chat/messages/${messageId}/`);
        return response.data;
    }
};

export default chatService;
