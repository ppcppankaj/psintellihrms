import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ArrowRight, MessageSquare, User } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { workflowService } from '../../api/workflowService';
import type { WorkflowInstance, WorkflowAction } from '../../api/workflowService';

const Approvals: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [pendingApprovals, setPendingApprovals] = useState<WorkflowInstance[]>([]);
    const [allInstances, setAllInstances] = useState<WorkflowInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
    const [actions, setActions] = useState<WorkflowAction[]>([]);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [comments, setComments] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            if (activeTab === 'pending') {
                const data = await workflowService.getMyPendingApprovals();
                setPendingApprovals(data.results || data.data || data || []);
            } else {
                const data = await workflowService.getInstances();
                setAllInstances(data.results || data.data || data || []);
            }
        } catch (error) {
            console.error('Failed to fetch approvals', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActions = async (instanceId: string) => {
        try {
            const data = await workflowService.getActions(instanceId);
            setActions(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch actions', error);
        }
    };

    const handleApprove = async (instanceId: string) => {
        try {
            await workflowService.approveStep(instanceId, comments);
            setIsDetailOpen(false);
            setComments('');
            fetchData();
        } catch (error) {
            console.error('Failed to approve', error);
            alert('Failed to approve');
        }
    };

    const handleReject = async (instanceId: string) => {
        if (!comments.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        try {
            await workflowService.rejectStep(instanceId, comments);
            setIsDetailOpen(false);
            setComments('');
            fetchData();
        } catch (error) {
            console.error('Failed to reject', error);
            alert('Failed to reject');
        }
    };

    const openDetail = async (instance: WorkflowInstance) => {
        setSelectedInstance(instance);
        await fetchActions(instance.id);
        setIsDetailOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            in_progress: 'bg-blue-100 text-blue-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            cancelled: 'bg-slate-100 text-slate-500',
            escalated: 'bg-yellow-100 text-yellow-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs capitalize ${styles[status] || ''}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const columns: Column<WorkflowInstance>[] = [
        {
            header: 'Workflow', accessor: (row) => (
                <div>
                    <p className="font-medium text-slate-800">{row.workflow_name || 'Workflow'}</p>
                    <p className="text-sm text-slate-500 capitalize">{row.entity_type?.replace('_', ' ')}</p>
                </div>
            )
        },
        {
            header: 'Request ID', accessor: (row) => (
                <span className="font-mono text-sm text-slate-600">#{row.entity_id?.slice(0, 8)}</span>
            )
        },
        {
            header: 'Current Step', accessor: (row) => (
                <div className="flex items-center gap-2">
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm">
                        Step {row.current_step}
                    </span>
                    {row.current_approver_name && (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                            <User size={14} /> {row.current_approver_name}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Started', accessor: (row) => (
                new Date(row.started_at).toLocaleDateString()
            )
        },
        { header: 'Status', accessor: (row) => getStatusBadge(row.status) },
    ];

    const data = activeTab === 'pending' ? pendingApprovals : allInstances;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Approval Workflows</h2>
                    <p className="text-slate-500 text-sm">Review and manage pending approvals</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{pendingApprovals.length}</p>
                            <p className="text-sm text-slate-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {allInstances.filter(i => i.status === 'approved').length}
                            </p>
                            <p className="text-sm text-slate-500">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <XCircle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {allInstances.filter(i => i.status === 'rejected').length}
                            </p>
                            <p className="text-sm text-slate-500">Rejected</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ArrowRight className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">
                                {allInstances.filter(i => i.status === 'in_progress').length}
                            </p>
                            <p className="text-sm text-slate-500">In Progress</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`pb-4 px-1 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'pending'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        My Pending
                        {pendingApprovals.length > 0 && (
                            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {pendingApprovals.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'history'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        All Requests
                    </button>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={data}
                isLoading={isLoading}
                actions={(row) => (
                    <button
                        onClick={() => openDetail(row)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                        View Details
                    </button>
                )}
            />

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedInstance(null);
                    setComments('');
                }}
                title="Approval Details"
            >
                {selectedInstance && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Workflow</p>
                                <p className="font-medium">{selectedInstance.workflow_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Status</p>
                                {getStatusBadge(selectedInstance.status)}
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Entity</p>
                                <p className="capitalize">{selectedInstance.entity_type?.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Current Step</p>
                                <p>Step {selectedInstance.current_step}</p>
                            </div>
                        </div>

                        {/* Action History */}
                        <div>
                            <h4 className="font-medium text-slate-700 mb-3">Action History</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                                {actions.length === 0 ? (
                                    <p className="text-slate-400 text-sm">No actions yet</p>
                                ) : (
                                    actions.map((action) => (
                                        <div key={action.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${action.action === 'approved' ? 'bg-green-100' :
                                                    action.action === 'rejected' ? 'bg-red-100' : 'bg-slate-100'
                                                }`}>
                                                {action.action === 'approved' ? (
                                                    <CheckCircle size={16} className="text-green-600" />
                                                ) : action.action === 'rejected' ? (
                                                    <XCircle size={16} className="text-red-600" />
                                                ) : (
                                                    <ArrowRight size={16} className="text-slate-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{action.actor_name || 'System'}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(action.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm capitalize">{action.action}</p>
                                                {action.comments && (
                                                    <p className="text-sm text-slate-600 mt-1 flex items-start gap-1">
                                                        <MessageSquare size={14} className="mt-0.5" />
                                                        {action.comments}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Action Buttons (only for pending) */}
                        {selectedInstance.status === 'in_progress' && (
                            <div className="space-y-3 border-t pt-4">
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Add comments (required for rejection)..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                                    rows={3}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApprove(selectedInstance.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <CheckCircle size={18} />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedInstance.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Approvals;
