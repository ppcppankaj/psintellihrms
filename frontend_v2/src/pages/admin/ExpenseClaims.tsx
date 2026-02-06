import React, { useState, useEffect } from 'react';
import { expenseService } from '../../api/expenseService';
import type { ExpenseClaim, ExpenseCategory, ExpenseAdvance } from '../../api/expenseService';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import { DataTable, type Column } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { Plus, Edit2, Trash2, Check, X, DollarSign, Receipt, Folder, CreditCard } from 'lucide-react';

const ExpenseClaims: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'claims' | 'categories' | 'advances'>('claims');
    const [claims, setClaims] = useState<ExpenseClaim[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [advances, setAdvances] = useState<ExpenseAdvance[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'claim' | 'category' | 'advance'>('claim');
    const [editingItem, setEditingItem] = useState<ExpenseClaim | ExpenseCategory | ExpenseAdvance | null>(null);

    useEffect(() => {
        fetchClaims();
        fetchCategories();
        fetchAdvances();
    }, []);

    const fetchClaims = async () => {
        setIsLoading(true);
        try {
            const response = await expenseService.getClaims();
            setClaims(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch expense claims', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await expenseService.getCategories();
            setCategories(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const fetchAdvances = async () => {
        try {
            const response = await expenseService.getAdvances();
            setAdvances(response.data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch advances', error);
        }
    };

    const handleClaimSubmit = async (data: Record<string, unknown>) => {
        try {
            if (editingItem) {
                await expenseService.updateClaim((editingItem as ExpenseClaim).id, data);
            } else {
                await expenseService.createClaim(data);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            fetchClaims();
        } catch (error) {
            console.error('Failed to save claim', error);
            alert('Failed to save claim');
        }
    };

    const handleCategorySubmit = async (data: Record<string, unknown>) => {
        try {
            if (editingItem) {
                await expenseService.updateCategory((editingItem as ExpenseCategory).id, data);
            } else {
                await expenseService.createCategory(data);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            fetchCategories();
        } catch (error) {
            console.error('Failed to save category', error);
            alert('Failed to save category');
        }
    };

    const handleAdvanceSubmit = async (data: Record<string, unknown>) => {
        try {
            await expenseService.createAdvance(data);
            setIsModalOpen(false);
            fetchAdvances();
        } catch (error) {
            console.error('Failed to create advance', error);
            alert('Failed to create advance');
        }
    };

    const handleDeleteClaim = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this claim?')) {
            try {
                await expenseService.deleteClaim(id);
                fetchClaims();
            } catch (error) {
                console.error('Failed to delete claim', error);
            }
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await expenseService.deleteCategory(id);
                fetchCategories();
            } catch (error) {
                console.error('Failed to delete category', error);
            }
        }
    };

    const handleApproveClaim = async (id: string) => {
        try {
            await expenseService.approveClaim(id);
            fetchClaims();
        } catch (error) {
            console.error('Failed to approve claim', error);
        }
    };

    const handleRejectClaim = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            try {
                await expenseService.rejectClaim(id, reason);
                fetchClaims();
            } catch (error) {
                console.error('Failed to reject claim', error);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-slate-100 text-slate-600',
            submitted: 'bg-blue-100 text-blue-700',
            pending_approval: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            paid: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-slate-100 text-slate-500',
            pending: 'bg-yellow-100 text-yellow-700',
            disbursed: 'bg-green-100 text-green-700',
            settled: 'bg-emerald-100 text-emerald-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ''}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const claimColumns: Column<ExpenseClaim>[] = [
        {
            header: 'Claim', accessor: (item) => (
                <div>
                    <p className="font-medium text-slate-800">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.employee_name || item.employee}</p>
                </div>
            )
        },
        {
            header: 'Period', accessor: (item) => (
                <span className="text-sm text-slate-600">
                    {new Date(item.expense_from).toLocaleDateString()} - {new Date(item.expense_to).toLocaleDateString()}
                </span>
            )
        },
        {
            header: 'Amount', accessor: (item) => (
                <div>
                    <p className="font-medium text-slate-800 flex items-center gap-1">
                        <DollarSign size={14} />
                        {parseFloat(item.total_claimed_amount).toLocaleString()}
                    </p>
                    {item.total_approved_amount && (
                        <p className="text-xs text-green-600">Approved: ${parseFloat(item.total_approved_amount).toLocaleString()}</p>
                    )}
                </div>
            )
        },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
        { header: 'Payment', accessor: (item) => getStatusBadge(item.payment_status || 'not_paid') },
    ];

    const categoryColumns: Column<ExpenseCategory>[] = [
        {
            header: 'Category', accessor: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Folder className="text-primary-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{item.code}</p>
                    </div>
                </div>
            )
        },
        { header: 'Description', accessor: (item) => item.description || '-' },
        {
            header: 'Status', accessor: (item) => (
                item.is_active !== false ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Active</span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs">Inactive</span>
                )
            )
        },
    ];

    const advanceColumns: Column<ExpenseAdvance>[] = [
        { header: 'Employee', accessor: (item) => item.employee_name || item.employee },
        { header: 'Purpose', accessor: 'purpose' },
        {
            header: 'Amount', accessor: (item) => (
                <span className="font-medium">${item.amount?.toLocaleString()}</span>
            )
        },
        { header: 'Requested', accessor: (item) => new Date(item.requested_date).toLocaleDateString() },
        { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
    ];

    const claimFields: FormFieldConfig[] = [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'employee', label: 'Employee ID', type: 'text', required: true },
        { name: 'claim_date', label: 'Claim Date', type: 'date', required: true },
        { name: 'expense_from', label: 'Expense From', type: 'date', required: true },
        { name: 'expense_to', label: 'Expense To', type: 'date', required: true },
        { name: 'total_claimed_amount', label: 'Total Amount', type: 'number', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
    ];

    const categoryFields: FormFieldConfig[] = [
        { name: 'name', label: 'Category Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
    ];

    const advanceFields: FormFieldConfig[] = [
        { name: 'employee', label: 'Employee ID', type: 'text', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'purpose', label: 'Purpose', type: 'textarea', required: true },
    ];

    const openModal = (type: 'claim' | 'category' | 'advance', item?: ExpenseClaim | ExpenseCategory | ExpenseAdvance) => {
        setModalType(type);
        setEditingItem(item || null);
        setIsModalOpen(true);
    };

    const totals = {
        pending: claims.filter(c => ['submitted', 'pending_approval'].includes(c.status)).length,
        approved: claims.filter(c => c.status === 'approved').length,
        totalAmount: claims.reduce((sum, c) => sum + parseFloat(c.total_claimed_amount || '0'), 0),
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Expense Management</h1>
                    <p className="text-slate-500">Manage claims, categories, and advances</p>
                </div>
                <button
                    onClick={() => openModal(activeTab === 'categories' ? 'category' : activeTab === 'advances' ? 'advance' : 'claim')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                    <Plus size={20} />
                    <span>Add {activeTab === 'categories' ? 'Category' : activeTab === 'advances' ? 'Advance' : 'Claim'}</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Receipt className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{totals.pending}</p>
                            <p className="text-sm text-slate-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Check className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{totals.approved}</p>
                            <p className="text-sm text-slate-500">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <DollarSign className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">${totals.totalAmount.toLocaleString()}</p>
                            <p className="text-sm text-slate-500">Total Claimed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <CreditCard className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{advances.filter(a => a.status === 'pending').length}</p>
                            <p className="text-sm text-slate-500">Pending Advances</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    {(['claims', 'categories', 'advances'] as const).map((tab) => (
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
            {activeTab === 'claims' && (
                <DataTable
                    columns={claimColumns}
                    data={claims}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex space-x-2">
                            {['submitted', 'pending_approval'].includes(item.status) && (
                                <>
                                    <button onClick={() => handleApproveClaim(item.id)} className="p-1 text-green-500 hover:text-green-700" title="Approve">
                                        <Check size={18} />
                                    </button>
                                    <button onClick={() => handleRejectClaim(item.id)} className="p-1 text-red-500 hover:text-red-700" title="Reject">
                                        <X size={18} />
                                    </button>
                                </>
                            )}
                            <button onClick={() => openModal('claim', item)} className="p-1 text-slate-400 hover:text-primary-600">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeleteClaim(item.id)} className="p-1 text-slate-400 hover:text-red-600">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                />
            )}

            {activeTab === 'categories' && (
                <DataTable
                    columns={categoryColumns}
                    data={categories}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex space-x-2">
                            <button onClick={() => openModal('category', item)} className="p-1 text-slate-400 hover:text-primary-600">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeleteCategory(item.id)} className="p-1 text-slate-400 hover:text-red-600">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                />
            )}

            {activeTab === 'advances' && (
                <DataTable
                    columns={advanceColumns}
                    data={advances}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex space-x-2">
                            {item.status === 'pending' && (
                                <button
                                    onClick={async () => {
                                        await expenseService.approveAdvance(item.id);
                                        fetchAdvances();
                                    }}
                                    className="text-green-600 text-sm"
                                >
                                    Approve
                                </button>
                            )}
                            {item.status === 'approved' && (
                                <button
                                    onClick={async () => {
                                        await expenseService.disburseAdvance(item.id);
                                        fetchAdvances();
                                    }}
                                    className="text-blue-600 text-sm"
                                >
                                    Disburse
                                </button>
                            )}
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
                    fields={modalType === 'claim' ? claimFields : modalType === 'category' ? categoryFields : advanceFields}
                    initialValues={editingItem || (modalType === 'category' ? { is_active: true } : {})}
                    onSubmit={modalType === 'claim' ? handleClaimSubmit : modalType === 'category' ? handleCategorySubmit : handleAdvanceSubmit}
                    onCancel={() => { setIsModalOpen(false); setEditingItem(null); }}
                />
            </Modal>
        </div>
    );
};

export default ExpenseClaims;
