/**
 * ChatSidebar - List of conversations with filters
 */
import { useState, useEffect } from 'react';
import { useChat, Conversation } from '@/context/ChatContext';
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, UserGroupIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { UserMini, chatService } from '@/services/chatService';
import { api } from '@/services/api';

type FilterType = 'all' | 'direct' | 'group' | 'department';
type ModalView = 'menu' | 'direct' | 'group';

interface Employee {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
}

export default function ChatSidebar() {
    const { conversations, activeConversationId, setActiveConversation, totalUnreadCount, refreshConversations } = useChat();
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [modalView, setModalView] = useState<ModalView>('menu');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Employee[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch employees when direct/group view is opened
    useEffect(() => {
        if (modalView === 'direct' || modalView === 'group') {
            fetchEmployees();
        }
    }, [modalView]);

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/employees/', { params: { page_size: 100 } });
            console.log('Employee API response:', response.data);
            const data = response.data;
            // Handle paginated response - API returns {success: true, data: [...]}
            let employeeList = [];
            if (Array.isArray(data)) {
                employeeList = data;
            } else if (data?.data && Array.isArray(data.data)) {
                employeeList = data.data;
            } else if (data?.results && Array.isArray(data.results)) {
                employeeList = data.results;
            }
            console.log('Extracted employees:', employeeList);
            // Map to consistent format
            const mapped = employeeList.map((emp: any) => ({
                id: emp.id,
                full_name: emp.full_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Unknown',
                email: emp.email || emp.work_email || '',
                avatar: emp.avatar || emp.photo
            }));
            console.log('Mapped employees:', mapped);
            setEmployees(mapped);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            setEmployees([]);
        }
    };

    const filteredEmployees = Array.isArray(employees)
        ? employees.filter(emp =>
            emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
            emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
        )
        : [];

    const handleStartDirectChat = async (employee: Employee) => {
        setIsLoading(true);
        try {
            const conversation = await chatService.startDirectChat(employee.id);
            setActiveConversation(conversation.id);
            closeModal();
            refreshConversations();
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
        setIsLoading(false);
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        setIsLoading(true);
        try {
            const conversation = await chatService.createGroupChat(
                groupName,
                selectedUsers.map(u => u.id)
            );
            setActiveConversation(conversation.id);
            closeModal();
            refreshConversations();
        } catch (error) {
            console.error('Failed to create group:', error);
        }
        setIsLoading(false);
    };

    const toggleUserSelection = (employee: Employee) => {
        setSelectedUsers(prev =>
            prev.find(u => u.id === employee.id)
                ? prev.filter(u => u.id !== employee.id)
                : [...prev, employee]
        );
    };

    const closeModal = () => {
        setShowNewChatModal(false);
        setModalView('menu');
        setEmployeeSearch('');
        setSelectedUsers([]);
        setGroupName('');
    };

    const filteredConversations = conversations.filter(conv => {
        if (filter !== 'all' && conv.type !== filter) return false;
        if (searchQuery) {
            const name = conv.name || conv.participants_preview.map(p => p.full_name).join(', ');
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    const getConversationName = (conv: Conversation) => {
        if (conv.name) return conv.name;
        return conv.participants_preview.map((p: UserMini) => p.full_name).join(', ') || 'Unknown';
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-80 border-r border-surface-200 dark:border-surface-700 flex flex-col bg-white dark:bg-surface-800">
            {/* Header */}
            <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                        Messages
                        {totalUnreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary-500 text-white rounded-full">
                                {totalUnreadCount}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={() => setShowNewChatModal(true)}
                        className="p-2 text-surface-500 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                        title="New Chat"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-700 focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-surface-200 dark:border-surface-700 px-2">
                {(['all', 'direct', 'group', 'department'] as FilterType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-3 py-2 text-xs font-medium capitalize ${filter === type
                            ? 'text-primary-600 border-b-2 border-primary-600'
                            : 'text-surface-500 hover:text-surface-700'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-surface-500 text-sm">
                        No conversations found
                    </div>
                ) : (
                    filteredConversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => setActiveConversation(conv.id)}
                            className={`w-full p-3 flex items-start gap-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors ${conv.id === activeConversationId ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                                {getConversationName(conv).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-surface-900 dark:text-white truncate">
                                        {getConversationName(conv)}
                                    </span>
                                    {conv.last_message && (
                                        <span className="text-xs text-surface-500 flex-shrink-0">
                                            {formatTime(conv.last_message.created_at)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <p className="text-sm text-surface-500 truncate">
                                        {conv.last_message?.content || 'No messages yet'}
                                    </p>
                                    {conv.unread_count > 0 && (
                                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-500 text-white rounded-full flex-shrink-0">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
                            {modalView !== 'menu' && (
                                <button onClick={() => setModalView('menu')} className="mr-2 text-surface-500 hover:text-surface-700">
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </button>
                            )}
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex-1">
                                {modalView === 'menu' && 'New Conversation'}
                                {modalView === 'direct' && 'Start Direct Message'}
                                {modalView === 'group' && 'Create Group Chat'}
                            </h3>
                            <button onClick={closeModal} className="text-surface-500 hover:text-surface-700">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto">
                            {modalView === 'menu' && (
                                <div className="p-4 space-y-3">
                                    <button
                                        onClick={() => setModalView('direct')}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                            <UserIcon className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white">Direct Message</p>
                                            <p className="text-sm text-surface-500">Start a 1:1 conversation</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setModalView('group')}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <UserGroupIcon className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white">Group Chat</p>
                                            <p className="text-sm text-surface-500">Create a group conversation</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {modalView === 'direct' && (
                                <div className="p-4">
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={employeeSearch}
                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-700 mb-3"
                                    />
                                    <div className="space-y-1 max-h-64 overflow-y-auto">
                                        {filteredEmployees.map(emp => (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleStartDirectChat(emp)}
                                                disabled={isLoading}
                                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-left disabled:opacity-50"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm">
                                                    {emp.full_name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{emp.full_name}</p>
                                                    <p className="text-xs text-surface-500 truncate">{emp.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {filteredEmployees.length === 0 && (
                                            <p className="text-center text-surface-500 text-sm py-4">No employees found</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {modalView === 'group' && (
                                <div className="p-4">
                                    <input
                                        type="text"
                                        placeholder="Group name"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-700 mb-3"
                                    />
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {selectedUsers.map(user => (
                                                <span key={user.id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                                                    {user.full_name}
                                                    <button onClick={() => toggleUserSelection(user)} className="hover:text-primary-900">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        placeholder="Search employees to add..."
                                        value={employeeSearch}
                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-700 mb-3"
                                    />
                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {filteredEmployees.map(emp => (
                                            <button
                                                key={emp.id}
                                                onClick={() => toggleUserSelection(emp)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-left ${selectedUsers.find(u => u.id === emp.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm">
                                                    {emp.full_name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{emp.full_name}</p>
                                                </div>
                                                {selectedUsers.find(u => u.id === emp.id) && (
                                                    <span className="text-primary-600">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer for Group */}
                        {modalView === 'group' && (
                            <div className="p-4 border-t border-surface-200 dark:border-surface-700">
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={!groupName.trim() || selectedUsers.length === 0 || isLoading}
                                    className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Creating...' : `Create Group (${selectedUsers.length} members)`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
