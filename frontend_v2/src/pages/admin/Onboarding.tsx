import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Copy, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import { Modal } from '../../components/Modal';
import { onboardingService } from '../../api/onboardingService';
import type { OnboardingTemplate, EmployeeOnboarding } from '../../api/onboardingService';

const OnboardingManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'templates'>('active');
    const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
    const [onboardings, setOnboardings] = useState<EmployeeOnboarding[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null>(null);

    useEffect(() => {
        if (activeTab === 'templates') {
            fetchTemplates();
        } else {
            fetchOnboardings();
        }
    }, [activeTab]);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const data = await onboardingService.getTemplates();
            setTemplates(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch templates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOnboardings = async () => {
        try {
            setIsLoading(true);
            const data = await onboardingService.getOnboardings();
            setOnboardings(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch onboardings', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitTemplate = async (values: Record<string, unknown>) => {
        try {
            if (editingTemplate) {
                await onboardingService.updateTemplate(editingTemplate.id, values);
            } else {
                await onboardingService.createTemplate(values);
            }
            setIsModalOpen(false);
            setEditingTemplate(null);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to save template', error);
            alert('Failed to save template');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await onboardingService.deleteTemplate(id);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to delete template', error);
        }
    };

    const handleDuplicate = async (id: string) => {
        const newName = prompt('Enter name for the duplicated template:');
        if (!newName) return;
        try {
            await onboardingService.duplicateTemplate(id, newName);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to duplicate template', error);
        }
    };

    const templateFormFields: FormFieldConfig[] = [
        { name: 'name', label: 'Template Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'ENG_ONBOARD' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'completion_days', label: 'Completion Days', type: 'number', required: true, placeholder: '30' },
        { name: 'is_default', label: 'Default Template', type: 'checkbox' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
    ];

    const templateColumns: Column<OnboardingTemplate>[] = [
        {
            header: 'Template Name', accessor: (row) => (
                <div>
                    <p className="font-medium text-slate-800">{row.name}</p>
                    <p className="text-sm text-slate-500">{row.code}</p>
                </div>
            )
        },
        {
            header: 'Duration', accessor: (row) => (
                <span className="flex items-center gap-1 text-slate-600">
                    <Clock size={14} />
                    {row.completion_days} days
                </span>
            )
        },
        {
            header: 'Default', accessor: (row) => (
                row.is_default ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Default</span>
                ) : <span />
            )
        },
        {
            header: 'Status', accessor: (row) => (
                row.is_active ? (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Active</span>
                ) : (
                    <span className="flex items-center gap-1 text-slate-400"><XCircle size={14} /> Inactive</span>
                )
            )
        },
    ];

    const onboardingColumns: Column<EmployeeOnboarding>[] = [
        {
            header: 'Employee', accessor: (row) => (
                <div>
                    <p className="font-medium text-slate-800">{row.employee_name || 'Unknown'}</p>
                    <p className="text-sm text-slate-500">{row.template_name}</p>
                </div>
            )
        },
        {
            header: 'Joining Date', accessor: (row) => (
                new Date(row.joining_date).toLocaleDateString()
            )
        },
        {
            header: 'Progress', accessor: (row) => (
                <div className="w-32">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span>{row.progress_percentage}%</span>
                        <span className="text-slate-400">{row.tasks_completed}/{row.tasks_total}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${row.progress_percentage}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            header: 'Status', accessor: (row) => {
                const statusColors: Record<string, string> = {
                    not_started: 'bg-slate-100 text-slate-600',
                    in_progress: 'bg-blue-100 text-blue-700',
                    completed: 'bg-green-100 text-green-700',
                    cancelled: 'bg-red-100 text-red-700',
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColors[row.status] || ''}`}>
                        {row.status.replace('_', ' ')}
                    </span>
                );
            }
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Employee Onboarding</h2>
                    <p className="text-slate-500 text-sm">Manage onboarding workflows and track new hire progress</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} />
                    {activeTab === 'templates' ? 'New Template' : 'Initiate Onboarding'}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`pb-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'active'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Active Onboardings
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`pb-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'templates'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Templates
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'templates' ? (
                <DataTable
                    columns={templateColumns}
                    data={templates}
                    isLoading={isLoading}
                    actions={(row) => (
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleDuplicate(row.id)} className="p-1 hover:bg-slate-100 rounded" title="Duplicate">
                                <Copy size={16} className="text-slate-500" />
                            </button>
                            <button onClick={() => { setEditingTemplate(row); setIsModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded" title="Edit">
                                <Edit size={16} className="text-slate-500" />
                            </button>
                            <button onClick={() => handleDeleteTemplate(row.id)} className="p-1 hover:bg-slate-100 rounded" title="Delete">
                                <Trash2 size={16} className="text-red-500" />
                            </button>
                        </div>
                    )}
                />
            ) : (
                <DataTable
                    columns={onboardingColumns}
                    data={onboardings}
                    isLoading={isLoading}
                    actions={(row) => (
                        <button onClick={() => console.log('View', row.id)} className="p-1 hover:bg-slate-100 rounded flex items-center gap-1 text-primary-600">
                            <ChevronRight size={16} /> View
                        </button>
                    )}
                />
            )}

            {/* Template Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTemplate(null);
                }}
                title={editingTemplate ? 'Edit Template' : 'Create Onboarding Template'}
            >
                <DynamicForm
                    fields={templateFormFields}
                    initialValues={editingTemplate || { is_active: true, completion_days: 30 }}
                    onSubmit={handleSubmitTemplate}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingTemplate(null);
                    }}
                />
            </Modal>
        </div>
    );
};

export default OnboardingManagement;
