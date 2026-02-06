import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Users, Plus, Search, MoreVertical, Smile, Paperclip } from 'lucide-react';
import { chatService } from '../../api/chatService';
import { employeeService } from '../../api/employeeService';
import type { Employee } from '../../api/employeeService';
import type { Conversation, Message } from '../../api/chatService';
import { Modal } from '../../components/Modal';

const Chat: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [modalView, setModalView] = useState<'options' | 'select_user' | 'create_group'>('options');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            setIsLoading(true);
            const data = await chatService.getConversations();
            setConversations(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            setIsEmployeesLoading(true);
            const data = await employeeService.getEmployees();
            setEmployees(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setIsEmployeesLoading(false);
        }
    };

    useEffect(() => {
        if (isNewChatOpen && modalView === 'select_user') {
            fetchEmployees();
        }
    }, [isNewChatOpen, modalView]);

    const handleStartDirectChat = async (userId: string) => {
        try {
            const conversation = await chatService.startDirectConversation(userId);
            setSelectedConversation(conversation.data || conversation);
            setIsNewChatOpen(false);
            fetchConversations();
        } catch (error) {
            console.error('Failed to start chat', error);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const data = await chatService.getMessages(conversationId);
            setMessages(data.results || data.data || data || []);
            // Mark as read
            await chatService.markAsRead(conversationId);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const message = await chatService.sendMessage({
                conversation: selectedConversation.id,
                content: newMessage.trim()
            });
            setMessages(prev => [...prev, message.data || message]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleReaction = async (messageId: string, reaction: string) => {
        try {
            await chatService.addReaction(messageId, reaction);
            // Refresh messages to show reaction
            if (selectedConversation) {
                fetchMessages(selectedConversation.id);
            }
        } catch (error) {
            console.error('Failed to add reaction', error);
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getConversationName = (conv: Conversation) => {
        if (conv.name) return conv.name;
        if (conv.type === 'direct' && conv.participants?.length > 0) {
            return conv.participants.find(p => p.user_name)?.user_name || 'Direct Message';
        }
        return `${conv.type.charAt(0).toUpperCase() + conv.type.slice(1)} Chat`;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'group': return <Users size={16} className="text-blue-400" />;
            case 'department': return <Users size={16} className="text-green-400" />;
            case 'announcement': return <MessageSquare size={16} className="text-yellow-400" />;
            default: return <MessageSquare size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Conversation List */}
            <div className="w-80 border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Messages</h2>
                        <button
                            onClick={() => setIsNewChatOpen(true)}
                            className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                            <MessageSquare size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">No conversations yet</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 ${selectedConversation?.id === conv.id ? 'bg-primary-50' : ''
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
                                    {getConversationName(conv).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(conv.type)}
                                        <span className="font-medium text-slate-800 truncate">
                                            {getConversationName(conv)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate mt-1">
                                        {conv.last_message?.content || 'No messages yet'}
                                    </p>
                                </div>
                                {conv.unread_count && conv.unread_count > 0 && (
                                    <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                                        {conv.unread_count}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
                                    {getConversationName(selectedConversation).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">
                                        {getConversationName(selectedConversation)}
                                    </h3>
                                    <p className="text-sm text-slate-500 capitalize">
                                        {selectedConversation.type} chat
                                        {selectedConversation.participants && ` • ${selectedConversation.participants.length} members`}
                                    </p>
                                </div>
                            </div>
                            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                <MoreVertical size={20} className="text-slate-600" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.is_system_message ? 'justify-center' : 'items-start gap-3'}`}
                                >
                                    {message.is_system_message ? (
                                        <span className="text-sm text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                                            {message.content}
                                        </span>
                                    ) : (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-sm font-medium">
                                                {message.sender_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 max-w-[70%]">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm text-slate-800">
                                                        {message.sender_name || 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(message.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                                                    <p className="text-slate-700">{message.content}</p>
                                                    {message.attachment && (
                                                        <a
                                                            href={message.attachment}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary-600 text-sm hover:underline mt-2 block"
                                                        >
                                                            📎 Attachment
                                                        </a>
                                                    )}
                                                </div>
                                                {message.reactions && message.reactions.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {message.reactions.map((r, i) => (
                                                            <span key={i} className="bg-slate-100 px-2 py-0.5 rounded-full text-sm">
                                                                {r.reaction}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                                                    {['👍', '❤️', '😊'].map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(message.id, emoji)}
                                                            className="hover:scale-125 transition-transform"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white">
                            <div className="flex items-center gap-3">
                                <button type="button" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Paperclip size={20} className="text-slate-500" />
                                </button>
                                <button type="button" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Smile size={20} className="text-slate-500" />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <MessageSquare size={64} className="mb-4 opacity-30" />
                        <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                        <p className="text-sm">Choose a chat from the left to start messaging</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isNewChatOpen}
                onClose={() => {
                    setIsNewChatOpen(false);
                    setModalView('options');
                }}
                title={
                    modalView === 'select_user' ? 'Select User' :
                        modalView === 'create_group' ? 'Create Group Chat' :
                            'Start New Conversation'
                }
            >
                {modalView === 'options' ? (
                    <div className="space-y-4">
                        <p className="text-slate-600">
                            Select a user to start a direct message or create a group chat.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setModalView('select_user')}
                                className="flex-1 p-4 border border-slate-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                            >
                                <MessageSquare className="mx-auto mb-2 text-primary-600" size={32} />
                                <p className="font-medium">Direct Message</p>
                            </button>
                            <button
                                onClick={() => setModalView('create_group')}
                                className="flex-1 p-4 border border-slate-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                            >
                                <Users className="mx-auto mb-2 text-primary-600" size={32} />
                                <p className="font-medium">Group Chat</p>
                            </button>
                        </div>
                    </div>
                ) : modalView === 'select_user' ? (
                    <div className="space-y-4">
                        <div className="max-h-80 overflow-y-auto space-y-2">
                            {isEmployeesLoading ? (
                                <div className="p-4 text-center text-slate-500">Loading users...</div>
                            ) : employees.length === 0 ? (
                                <div className="p-4 text-center text-slate-500">No users found</div>
                            ) : (
                                employees.map((emp) => (
                                    <button
                                        key={emp.id}
                                        onClick={() => handleStartDirectChat(emp.id)}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-700 overflow-hidden">
                                            {emp.avatar ? (
                                                <img src={emp.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                (emp.full_name || emp.email || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-slate-800 truncate max-w-[200px]">
                                                {emp.full_name || emp.email || 'Unknown User'}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                                {emp.designation_name || emp.department_name || 'Staff Member'}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => setModalView('options')}
                            className="w-full py-2 text-sm text-slate-600 hover:text-slate-800"
                        >
                            Back to options
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 p-4 text-center">
                        <p className="text-slate-500 italic">Group chat creation is coming soon</p>
                        <button
                            onClick={() => setModalView('options')}
                            className="w-full py-2 text-sm text-slate-600 hover:text-slate-800"
                        >
                            Back to options
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Chat;
