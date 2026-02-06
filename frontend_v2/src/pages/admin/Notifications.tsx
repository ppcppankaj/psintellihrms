import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Mail } from 'lucide-react';
import { notificationService } from '../../api/notificationService';
import type { Notification } from '../../api/notificationService';

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, []);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await notificationService.getNotifications();
            setNotifications(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const data = await notificationService.getUnreadCount();
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'read' } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, status: 'read' }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => n.status !== 'read')
        : notifications;

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Mail size={16} className="text-blue-500" />;
            case 'push': return <Bell size={16} className="text-yellow-500" />;
            default: return <Bell size={16} className="text-slate-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'read':
                return <CheckCheck size={16} className="text-green-500" />;
            case 'delivered':
                return <Check size={16} className="text-blue-500" />;
            default:
                return <div className="w-2 h-2 rounded-full bg-primary-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
                    <p className="text-slate-500 text-sm">Stay updated with important alerts and messages</p>
                </div>
                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${filter === 'unread' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600'
                                }`}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Bell size={48} className="mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-1">No notifications</h3>
                        <p className="text-sm">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${notification.status !== 'read' ? 'bg-primary-50/50' : ''
                                    }`}
                                onClick={() => notification.status !== 'read' && handleMarkAsRead(notification.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.status !== 'read' ? 'bg-primary-100' : 'bg-slate-100'
                                        }`}>
                                        {getChannelIcon(notification.channel)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-medium truncate ${notification.status !== 'read' ? 'text-slate-900' : 'text-slate-700'
                                                }`}>
                                                {notification.subject}
                                            </h4>
                                            {getStatusBadge(notification.status)}
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2">
                                            {notification.body}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                            <span>{formatDate(notification.created_at)}</span>
                                            {notification.entity_type && (
                                                <span className="px-2 py-0.5 bg-slate-100 rounded-full capitalize">
                                                    {notification.entity_type.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
