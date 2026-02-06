import React, { useState, useEffect } from 'react';
import { Link2, Check, X, Settings, RefreshCw, Plus, ExternalLink, Key, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import api from '../../api';

interface Integration {
    id: string;
    name: string;
    provider: string;
    category: 'payroll' | 'accounting' | 'communication' | 'storage' | 'calendar' | 'other';
    status: 'active' | 'inactive' | 'error' | 'pending';
    last_sync?: string;
    config?: Record<string, unknown>;
    webhook_url?: string;
    api_key_set: boolean;
}

interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string[];
    is_active: boolean;
    secret_set: boolean;
    last_triggered?: string;
    failure_count: number;
}

const Integrations: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks'>('integrations');
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'integration' | 'webhook'>('integration');
    const [editingItem, setEditingItem] = useState<Integration | Webhook | null>(null);

    useEffect(() => {
        fetchIntegrations();
        fetchWebhooks();
    }, []);

    const fetchIntegrations = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/integrations/');
            setIntegrations(response.data.data || response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch integrations', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWebhooks = async () => {
        try {
            const response = await api.get('/webhooks/');
            setWebhooks(response.data.data || response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch webhooks', error);
        }
    };

    const handleSync = async (integrationId: string) => {
        try {
            await api.post(`/integrations/${integrationId}/sync/`);
            fetchIntegrations();
        } catch (error) {
            console.error('Failed to sync integration', error);
            alert('Sync failed');
        }
    };

    const handleToggleStatus = async (integrationId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await api.patch(`/integrations/${integrationId}/`, { status: newStatus });
            fetchIntegrations();
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const handleIntegrationSubmit = async (data: Record<string, unknown>) => {
        try {
            if (editingItem) {
                await api.put(`/integrations/${(editingItem as Integration).id}/`, data);
            } else {
                await api.post('/integrations/', data);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            fetchIntegrations();
        } catch (error) {
            console.error('Failed to save integration', error);
            alert('Failed to save integration');
        }
    };

    const handleWebhookSubmit = async (data: Record<string, unknown>) => {
        try {
            if (editingItem) {
                await api.put(`/webhooks/${(editingItem as Webhook).id}/`, data);
            } else {
                await api.post('/webhooks/', data);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            fetchWebhooks();
        } catch (error) {
            console.error('Failed to save webhook', error);
            alert('Failed to save webhook');
        }
    };

    const handleDeleteWebhook = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this webhook?')) {
            try {
                await api.delete(`/webhooks/${id}/`);
                fetchWebhooks();
            } catch (error) {
                console.error('Failed to delete webhook', error);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-slate-100 text-slate-600',
            error: 'bg-red-100 text-red-700',
            pending: 'bg-yellow-100 text-yellow-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ''}`}>
                {status}
            </span>
        );
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            payroll: 'bg-green-100 text-green-600',
            accounting: 'bg-blue-100 text-blue-600',
            communication: 'bg-purple-100 text-purple-600',
            storage: 'bg-amber-100 text-amber-600',
            calendar: 'bg-pink-100 text-pink-600',
            other: 'bg-slate-100 text-slate-600',
        };
        return colors[category] || 'bg-slate-100 text-slate-600';
    };

    const integrationColumns: Column<Integration>[] = [
        {
            header: 'Integration', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(item.category)}`}>
                        <Link2 size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500">{item.provider}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Category', accessor: (item) => (
                <span className="capitalize">{item.category}</span>
            )
        },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
        {
            header: 'API Key', accessor: (item) => (
                item.api_key_set ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Key size={14} /> Configured
                    </span>
                ) : (
                    <span className="text-slate-400 text-sm">Not set</span>
                )
            )
        },
        { header: 'Last Sync', accessor: (item) => item.last_sync ? new Date(item.last_sync).toLocaleString() : '-' },
    ];

    const webhookColumns: Column<Webhook>[] = [
        {
            header: 'Webhook', accessor: (item) => (
                <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500 font-mono truncate max-w-xs">{item.url}</p>
                </div>
            )
        },
        {
            header: 'Events', accessor: (item) => (
                <div className="flex gap-1 flex-wrap">
                    {item.events.slice(0, 2).map(e => (
                        <span key={e} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{e}</span>
                    ))}
                    {item.events.length > 2 && (
                        <span className="text-xs text-slate-400">+{item.events.length - 2}</span>
                    )}
                </div>
            )
        },
        {
            header: 'Active', accessor: (item) => (
                item.is_active ? (
                    <Check className="text-green-500" size={18} />
                ) : (
                    <X className="text-slate-300" size={18} />
                )
            )
        },
        { header: 'Last Triggered', accessor: (item) => item.last_triggered ? new Date(item.last_triggered).toLocaleString() : '-' },
        {
            header: 'Failures', accessor: (item) => (
                item.failure_count > 0 ? (
                    <span className="text-red-600 font-medium">{item.failure_count}</span>
                ) : (
                    <span className="text-slate-400">0</span>
                )
            )
        },
    ];

    const integrationFormFields: FormFieldConfig[] = [
        { name: 'name', label: 'Integration Name', type: 'text', required: true },
        { name: 'provider', label: 'Provider', type: 'text', required: true },
        {
            name: 'category', label: 'Category', type: 'select', required: true, options: [
                { value: 'payroll', label: 'Payroll' },
                { value: 'accounting', label: 'Accounting' },
                { value: 'communication', label: 'Communication' },
                { value: 'storage', label: 'Storage' },
                { value: 'calendar', label: 'Calendar' },
                { value: 'other', label: 'Other' },
            ]
        },
        { name: 'api_key', label: 'API Key', type: 'text' },
        { name: 'webhook_url', label: 'Webhook URL', type: 'text' },
    ];

    const webhookFormFields: FormFieldConfig[] = [
        { name: 'name', label: 'Webhook Name', type: 'text', required: true },
        { name: 'url', label: 'Endpoint URL', type: 'text', required: true },
        { name: 'secret', label: 'Secret Key', type: 'text' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
    ];

    const stats = {
        total: integrations.length,
        active: integrations.filter(i => i.status === 'active').length,
        webhooks: webhooks.length,
        errors: integrations.filter(i => i.status === 'error').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
                    <p className="text-slate-500">Connect third-party services and manage webhooks</p>
                </div>
                <button
                    onClick={() => {
                        setModalType(activeTab === 'webhooks' ? 'webhook' : 'integration');
                        setEditingItem(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} />
                    Add {activeTab === 'webhooks' ? 'Webhook' : 'Integration'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Link2 className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                            <p className="text-sm text-slate-500">Integrations</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Check className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
                            <p className="text-sm text-slate-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <ExternalLink className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.webhooks}</p>
                            <p className="text-sm text-slate-500">Webhooks</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <X className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.errors}</p>
                            <p className="text-sm text-slate-500">Errors</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {(['integrations', 'webhooks'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors capitalize ${activeTab === tab
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {activeTab === 'integrations' && (
                <DataTable
                    columns={integrationColumns}
                    data={integrations}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex gap-2">
                            <button onClick={() => handleSync(item.id)} className="p-1 text-blue-500 hover:text-blue-700" title="Sync">
                                <RefreshCw size={16} />
                            </button>
                            <button onClick={() => handleToggleStatus(item.id, item.status)} className="p-1 text-slate-400 hover:text-primary-600" title="Toggle">
                                <Settings size={16} />
                            </button>
                        </div>
                    )}
                />
            )}

            {activeTab === 'webhooks' && (
                <DataTable
                    columns={webhookColumns}
                    data={webhooks}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex gap-2">
                            <button onClick={() => { setModalType('webhook'); setEditingItem(item); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-primary-600">
                                <Settings size={16} />
                            </button>
                            <button onClick={() => handleDeleteWebhook(item.id)} className="p-1 text-slate-400 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                />
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                title={editingItem ? `Edit ${modalType}` : `New ${modalType}`}
            >
                <DynamicForm
                    fields={modalType === 'integration' ? integrationFormFields : webhookFormFields}
                    initialValues={editingItem || (modalType === 'webhook' ? { is_active: true } : { category: 'other' })}
                    onSubmit={modalType === 'integration' ? handleIntegrationSubmit : handleWebhookSubmit}
                    onCancel={() => { setIsModalOpen(false); setEditingItem(null); }}
                />
            </Modal>
        </div>
    );
};

export default Integrations;
