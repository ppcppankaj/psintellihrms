/**
 * ChatPage - Main chat interface
 */
import { useChat } from '@/context/ChatContext';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';

function ChatLayout() {
    const { activeConversationId } = useChat();

    return (
        <div className="flex h-[calc(100vh-64px)] bg-surface-50 dark:bg-surface-900">
            {/* Sidebar */}
            <ChatSidebar />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversationId ? (
                    <ChatWindow />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-surface-500">
                        <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="text-lg font-medium text-surface-700 dark:text-surface-300">Select a conversation</h3>
                            <p className="text-sm">Choose from the list or start a new chat</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ChatPage() {
    return <ChatLayout />;
}
