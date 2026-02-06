import React, { useState, useEffect } from 'react';
import { Shield, FileCheck, CheckCircle, Clock, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import api from '../../api';

interface CompliancePolicy {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    is_mandatory: boolean;
    effective_date: string;
    review_date?: string;
    status: 'draft' | 'active' | 'under_review' | 'archived';
}

interface ComplianceCheck {
    id: string;
    policy_name?: string;
    check_date: string;
    status: 'compliant' | 'non_compliant' | 'pending' | 'exempted';
    findings?: string;
    due_date?: string;
    assigned_to_name?: string;
}

interface AuditLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    user_name?: string;
    timestamp: string;
    changes?: Record<string, unknown>;
    ip_address?: string;
}

const Compliance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'policies' | 'checks' | 'audit'>('policies');
    const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
    const [checks, setChecks] = useState<ComplianceCheck[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<CompliancePolicy | null>(null);

    useEffect(() => {
        fetchPolicies();
        fetchChecks();
        fetchAuditLogs();
    }, []);

    const fetchPolicies = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/compliance/policies/');
            setPolicies(response.data.data || response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch policies', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchChecks = async () => {
        try {
            const response = await api.get('/compliance/checks/');
            setChecks(response.data.data || response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch compliance checks', error);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const response = await api.get('/audit/logs/');
            setAuditLogs(response.data.data || response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        }
    };

    const handlePolicySubmit = async (data: Record<string, unknown>) => {
        try {
            if (editingPolicy) {
                await api.put(`/compliance/policies/${editingPolicy.id}/`, data);
            } else {
                await api.post('/compliance/policies/', data);
            }
            setIsModalOpen(false);
            setEditingPolicy(null);
            fetchPolicies();
        } catch (error) {
            console.error('Failed to save policy', error);
            alert('Failed to save policy');
        }
    };

    const handleDeletePolicy = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this policy?')) {
            try {
                await api.delete(`/compliance/policies/${id}/`);
                fetchPolicies();
            } catch (error) {
                console.error('Failed to delete policy', error);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-slate-100 text-slate-600',
            active: 'bg-green-100 text-green-700',
            under_review: 'bg-yellow-100 text-yellow-700',
            archived: 'bg-slate-100 text-slate-500',
            compliant: 'bg-green-100 text-green-700',
            non_compliant: 'bg-red-100 text-red-700',
            pending: 'bg-yellow-100 text-yellow-700',
            exempted: 'bg-blue-100 text-blue-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ''}`}>
                {status?.replace('_', ' ')}
            </span>
        );
    };

    const policyColumns: Column<CompliancePolicy>[] = [
        {
            header: 'Policy', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{item.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Category', accessor: (item) => (
                <span className="capitalize">{item.category}</span>
            )
        },
        {
            header: 'Mandatory', accessor: (item) => (
                item.is_mandatory ? (
                    <span className="text-amber-600 font-medium">Required</span>
                ) : (
                    <span className="text-slate-400">Optional</span>
                )
            )
        },
        { header: 'Effective Date', accessor: (item) => new Date(item.effective_date).toLocaleDateString() },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
    ];

    const checkColumns: Column<ComplianceCheck>[] = [
        { header: 'Policy', accessor: (item) => item.policy_name || '-' },
        { header: 'Check Date', accessor: (item) => new Date(item.check_date).toLocaleDateString() },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
        { header: 'Assigned To', accessor: (item) => item.assigned_to_name || '-' },
        { header: 'Due Date', accessor: (item) => item.due_date ? new Date(item.due_date).toLocaleDateString() : '-' },
    ];

    const auditColumns: Column<AuditLog>[] = [
        {
            header: 'Action', accessor: (item) => (
                <span className="font-medium capitalize">{item.action}</span>
            )
        },
        { header: 'Entity', accessor: (item) => `${item.entity_type} #${item.entity_id}` },
        { header: 'User', accessor: (item) => item.user_name || '-' },
        { header: 'Timestamp', accessor: (item) => new Date(item.timestamp).toLocaleString() },
        { header: 'IP Address', accessor: (item) => item.ip_address || '-' },
    ];

    const policyFormFields: FormFieldConfig[] = [
        { name: 'name', label: 'Policy Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true },
        {
            name: 'category', label: 'Category', type: 'select', required: true, options: [
                { value: 'hr', label: 'HR' },
                { value: 'security', label: 'Security' },
                { value: 'safety', label: 'Safety' },
                { value: 'finance', label: 'Finance' },
                { value: 'data', label: 'Data Protection' },
            ]
        },
        { name: 'effective_date', label: 'Effective Date', type: 'date', required: true },
        { name: 'review_date', label: 'Review Date', type: 'date' },
        { name: 'is_mandatory', label: 'Mandatory', type: 'checkbox' },
        { name: 'description', label: 'Description', type: 'textarea' },
    ];

    const stats = {
        totalPolicies: policies.length,
        activePolicies: policies.filter(p => p.status === 'active').length,
        compliantChecks: checks.filter(c => c.status === 'compliant').length,
        pendingChecks: checks.filter(c => c.status === 'pending').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Compliance & Audit</h1>
                    <p className="text-slate-500">Manage policies, compliance checks, and audit trails</p>
                </div>
                {activeTab === 'policies' && (
                    <button
                        onClick={() => { setEditingPolicy(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={18} />
                        Add Policy
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Shield className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.totalPolicies}</p>
                            <p className="text-sm text-slate-500">Total Policies</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.activePolicies}</p>
                            <p className="text-sm text-slate-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <FileCheck className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.compliantChecks}</p>
                            <p className="text-sm text-slate-500">Compliant</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{stats.pendingChecks}</p>
                            <p className="text-sm text-slate-500">Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {(['policies', 'checks', 'audit'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-1 border-b-2 font-medium transition-colors capitalize ${activeTab === tab
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab === 'audit' ? 'Audit Logs' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {activeTab === 'policies' && (
                <DataTable
                    columns={policyColumns}
                    data={policies}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex gap-2">
                            <button onClick={() => { setEditingPolicy(item); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-primary-600">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeletePolicy(item.id)} className="p-1 text-slate-400 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                />
            )}

            {activeTab === 'checks' && (
                <DataTable columns={checkColumns} data={checks} isLoading={isLoading} />
            )}

            {activeTab === 'audit' && (
                <DataTable columns={auditColumns} data={auditLogs} isLoading={isLoading} />
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingPolicy(null); }}
                title={editingPolicy ? 'Edit Policy' : 'New Policy'}
            >
                <DynamicForm
                    fields={policyFormFields}
                    initialValues={editingPolicy || { is_mandatory: false, category: 'hr' }}
                    onSubmit={handlePolicySubmit}
                    onCancel={() => { setIsModalOpen(false); setEditingPolicy(null); }}
                />
            </Modal>
        </div>
    );
};

export default Compliance;
