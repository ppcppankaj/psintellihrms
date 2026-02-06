/**
 * Chat Context - WebSocket connection and global chat state manager
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { chatService, Conversation, Message } from '../services/chatService';
import { useOrganizationContextReady } from '@/hooks/useAppReady';

export type { Conversation, Message };

interface ChatState {
    conversations: Conversation[];
    activeConversationId: string | null;
    messages: Message[];
    isConnected: boolean;
    totalUnreadCount: number;
    typingUsers: Map<string, string>; // conversationId -> username
}

interface ChatContextType extends ChatState {
    setActiveConversation: (id: string | null) => void;
    sendMessage: (content: string) => void;
    sendTypingIndicator: (isTyping: boolean) => void;
    refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const tokens = useAuthStore(state => state.tokens);
    const tenant = useAuthStore(state => state.tenant);
    const user = useAuthStore(state => state.user);
    const isTenantReady = useOrganizationContextReady();
    
    // Don't initialize chat for superusers at all (public or tenant schemas)
    // Also require tenant readiness (auth + tenant resolved) - NOT for superusers
    const shouldEnableChat = Boolean(user && !user.is_superuser && isTenantReady);
    
    const [state, setState] = useState<ChatState>({
        conversations: [],
        activeConversationId: null,
        messages: [],
        isConnected: false,
        totalUnreadCount: 0,
        typingUsers: new Map(),
    });

    const wsRef = useRef<WebSocket | null>(null);

    // Load conversations on mount (only when chat is enabled)
    useEffect(() => {
        if (!shouldEnableChat) {
            return;
        }
        
        // Load conversations for tenant users
        refreshConversations();
    }, [shouldEnableChat]);

    const refreshConversations = async () => {
        // Don't attempt if chat is disabled or app not ready
        if (!shouldEnableChat) {
            return;
        }
        
        try {
            const response = await chatService.getConversations();
            // Handle both array and paginated response
            const conversations = Array.isArray(response) ? response : (response as any)?.results || [];
            const totalUnread = conversations.reduce((sum: number, c: Conversation) => sum + c.unread_count, 0);
            setState(prev => ({ ...prev, conversations, totalUnreadCount: totalUnread }));
        } catch (error: any) {
            // Silently skip 401 errors (expected for superusers without tenant, or during initialization)
            const status = error?.response?.status
            const errorCode = error?.response?.data?.error?.code || error?.response?.data?.error?.details?.code
            
            if (status === 401 || errorCode === 'user_not_found') {
                return; // Expected error - don't log
            }
            
            // Log unexpected errors
            console.error('Failed to load conversations:', error);
        }
    };

    // WebSocket connection when activeConversationId changes
    useEffect(() => {
        if (!state.activeConversationId || !tokens?.access || !shouldEnableChat) {
            wsRef.current?.close();
            return;
        }

        // Always load messages via REST first (works without WebSocket)
        loadMessages(state.activeConversationId);

        // Try WebSocket connection (optional - for real-time updates)
        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.hostname;
            const wsPort = '8000'; // Backend port
            const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/ws/chat/${state.activeConversationId}/?token=${tokens.access}`;

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setState(prev => ({ ...prev, isConnected: true }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };

            ws.onclose = () => {
                setState(prev => ({ ...prev, isConnected: false }));
            };

            ws.onerror = () => {
                // WebSocket failed - using REST fallback (polling)
                console.log('WebSocket unavailable, using REST API fallback');
                setState(prev => ({ ...prev, isConnected: false }));
            };
        } catch {
            console.log('WebSocket not supported, using REST API');
        }

        return () => {
            wsRef.current?.close();
        };
    }, [state.activeConversationId, tokens?.access]);

    const loadMessages = async (conversationId: string) => {
        try {
            const response = await chatService.getMessages(conversationId) as any;
            // Handle various response formats
            const messageList = Array.isArray(response)
                ? response
                : Array.isArray(response?.results)
                    ? response.results
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];
            setState(prev => ({ ...prev, messages: messageList }));
            chatService.markAsRead(conversationId);
        } catch (error) {
            console.error('Failed to load messages:', error);
            setState(prev => ({ ...prev, messages: [] }));
        }
    };

    const handleWebSocketMessage = (data: any) => {
        switch (data.type) {
            case 'chat_message':
                setState(prev => ({
                    ...prev,
                    messages: [...prev.messages, {
                        id: data.message_id,
                        conversation: state.activeConversationId!,
                        sender: { id: data.sender_id, full_name: data.sender_name, email: '', avatar: null },
                        content: data.content,
                        attachment: null,
                        is_system_message: false,
                        reply_to: null,
                        reactions_summary: {},
                        created_at: data.created_at,
                        updated_at: data.created_at,
                    }],
                }));
                break;

            case 'typing':
                setState(prev => {
                    const typingUsers = new Map(prev.typingUsers);
                    if (data.is_typing) {
                        typingUsers.set(data.user_id, data.username);
                    } else {
                        typingUsers.delete(data.user_id);
                    }
                    return { ...prev, typingUsers };
                });
                break;

            case 'user_online':
            case 'user_offline':
                // Could update online status here
                break;
        }
    };

    const setActiveConversation = useCallback((id: string | null) => {
        setState(prev => ({ ...prev, activeConversationId: id, messages: [] }));
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        // Try WebSocket first
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'chat_message',
                content,
            }));
        } else if (state.activeConversationId) {
            // Fallback to REST API
            try {
                const message = await chatService.sendMessage(state.activeConversationId, content);
                setState(prev => ({
                    ...prev,
                    messages: [...prev.messages, message],
                }));
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    }, [state.activeConversationId]);

    const sendTypingIndicator = useCallback((isTyping: boolean) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'typing',
                is_typing: isTyping,
            }));
        }
    }, []);

    return (
        <ChatContext.Provider value={{
            ...state,
            setActiveConversation,
            sendMessage,
            sendTypingIndicator,
            refreshConversations,
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
