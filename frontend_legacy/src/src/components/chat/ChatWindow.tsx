/**
 * ChatWindow - Message display and input area
 */
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { PaperAirplaneIcon, FaceSmileIcon, PaperClipIcon } from '@heroicons/react/24/outline';

export default function ChatWindow() {
    const { activeConversationId, messages, sendMessage, sendTypingIndicator, typingUsers, isConnected, conversations } = useChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const conversationName = activeConversation?.name ||
        activeConversation?.participants_preview.map(p => p.full_name).join(', ') ||
        'Unknown';

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);

        // Typing indicator
        sendTypingIndicator(true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingIndicator(false);
        }, 2000);
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        sendMessage(inputValue.trim());
        setInputValue('');
        sendTypingIndicator(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatMessageTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get typing users text
    const typingText = Array.from(typingUsers.values()).join(', ');

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-surface-800">
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                        {conversationName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-medium text-surface-900 dark:text-white">{conversationName}</h3>
                        <p className="text-xs text-surface-500">
                            {isConnected ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Online
                                </span>
                            ) : (
                                'Connecting...'
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Array.isArray(messages) && messages.map((message) => {
                    const isSelf = message.sender.id === 'current-user-id'; // TODO: Get from auth

                    return (
                        <div key={message.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${isSelf ? 'order-1' : ''}`}>
                                {!isSelf && (
                                    <p className="text-xs text-surface-500 mb-1 ml-1">{message.sender.full_name}</p>
                                )}
                                <div className={`px-4 py-2 rounded-2xl ${isSelf
                                    ? 'bg-primary-500 text-white rounded-br-md'
                                    : 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white rounded-bl-md'
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                <p className={`text-xs text-surface-400 mt-1 ${isSelf ? 'text-right mr-1' : 'ml-1'}`}>
                                    {formatMessageTime(message.created_at)}
                                </p>
                            </div>
                        </div>
                    );
                })}

                {/* Typing indicator */}
                {typingText && (
                    <div className="flex items-center gap-2 text-surface-500 text-sm">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span>{typingText} is typing...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-surface-200 dark:border-surface-700">
                <div className="flex items-end gap-2">
                    <button className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                        <PaperClipIcon className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                        <textarea
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full px-4 py-2 pr-10 text-sm border border-surface-200 dark:border-surface-600 rounded-xl bg-surface-50 dark:bg-surface-700 focus:ring-2 focus:ring-primary-500 resize-none"
                            style={{ minHeight: '40px', maxHeight: '120px' }}
                        />
                        <button className="absolute right-2 bottom-2 p-1 text-surface-400 hover:text-surface-600">
                            <FaceSmileIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
