import React, { useState, useEffect } from 'react';
import { Plus, FileText, Mail, Edit, Trash2, Code, Bell, MessageSquare, Smartphone } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import { Modal } from '../../components/Modal';
import { notificationService } from '../../api/notificationService';
import type { NotificationTemplate } from '../../api/notificationService';

const NotificationTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const data = await notificationService.getTemplates();
            setTemplates(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch templates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (values: Record<string, unknown>) => {
        try {
            if (editingTemplate) {
                await notificationService.updateTemplate(editingTemplate.id, values);
            } else {
                await notificationService.createTemplate(values);
            }
            setIsModalOpen(false);
            setEditingTemplate(null);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to save template', error);
            alert('Failed to save template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await notificationService.deleteTemplate(id);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to delete template', error);
        }
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Mail size={16} className="text-blue-500" />;
            case 'sms': return <Smartphone size={16} className="text-green-500" />;
            case 'push': return <Bell size={16} className="text-yellow-500" />;
            case 'slack': return <MessageSquare size={16} className="text-purple-500" />;
            default: return <Bell size={16} className="text-slate-400" />;
        }
    };

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Template Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'LEAVE_APPROVED' },
        {
            name: 'channel', label: 'Channel', type: 'select', required: true, options: [
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
                { value: 'push', label: 'Push Notification' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'slack', label: 'Slack' },
                { value: 'teams', label: 'Microsoft Teams' },
            ]
        },
        { name: 'subject', label: 'Subject', type: 'text', required: true },
        { name: 'body', label: 'Body', type: 'textarea', required: true, placeholder: 'Hello {{employee_name}}, your leave has been {{status}}.' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
    ];

    const columns: Column<NotificationTemplate>[] = [
        {
            header: 'Template', accessor: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FileText className="text-slate-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{row.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{row.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Channel', accessor: (row) => (
                <span className="flex items-center gap-2 capitalize">
                    {getChannelIcon(row.channel)}
                    {row.channel}
                </span>
            )
        },
        {
            header: 'Subject', accessor: (row) => (
                <span className="text-slate-600 truncate max-w-xs block">{row.subject}</span>
            )
        },
        {
            header: 'Variables', accessor: (row) => (
                <div className="flex flex-wrap gap-1 max-w-xs">
                    {row.variables?.slice(0, 3).map((v, idx) => (
                        <span key={idx} className="flex items-center gap-0.5 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                            <Code size={10} />
                            {v}
                        </span>
                    ))}
                    {(row.variables?.length || 0) > 3 && (
                        <span className="text-xs text-slate-400">+{row.variables.length - 3}</span>
                    )}
                </div>
            )
        },
        {
            header: 'Status', accessor: (row) => (
                row.is_active !== false ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Active</span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs">Inactive</span>
                )
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Notification Templates</h2>
                    <p className="text-slate-500 text-sm">Manage email and notification templates</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Template
                </button>
            </div>

            {/* Channel Summary */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {['email', 'sms', 'push', 'whatsapp', 'slack', 'teams'].map((channel) => (
                    <div key={channel} className="bg-white rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            {getChannelIcon(channel)}
                            <span className="text-sm font-medium capitalize">{channel}</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                            {templates.filter(t => t.channel === channel).length}
                        </p>
                    </div>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={templates}
                isLoading={isLoading}
                actions={(row) => (
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingTemplate(row); setIsModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded" title="Edit">
                            <Edit size={16} className="text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1 hover:bg-slate-100 rounded" title="Delete">
                            <Trash2 size={16} className="text-red-500" />
                        </button>
                    </div>
                )}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTemplate(null);
                }}
                title={editingTemplate ? 'Edit Template' : 'Create Template'}
            >
                <DynamicForm
                    fields={formFields}
                    initialValues={editingTemplate || { channel: 'email', is_active: true }}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingTemplate(null);
                    }}
                />
            </Modal>
        </div>
    );
};

export default NotificationTemplates;
