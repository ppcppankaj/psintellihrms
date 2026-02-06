import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Check, DollarSign, Users, Building2, Edit, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import { Modal } from '../../components/Modal';
import { billingService } from '../../api/billingService';
import type { Plan } from '../../api/billingService';

const Plans: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setIsLoading(true);
            const data = await billingService.getPlans();
            setPlans(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch plans', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (values: Record<string, unknown>) => {
        try {
            if (editingPlan) {
                await billingService.updatePlan(editingPlan.id, values);
            } else {
                await billingService.createPlan(values);
            }
            setIsModalOpen(false);
            setEditingPlan(null);
            fetchPlans();
        } catch (error) {
            console.error('Failed to save plan', error);
            alert('Failed to save plan');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;
        try {
            await billingService.deletePlan(id);
            fetchPlans();
        } catch (error) {
            console.error('Failed to delete plan', error);
        }
    };

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Plan Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'ENTERPRISE' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'price_monthly', label: 'Monthly Price', type: 'number', required: true },
        { name: 'price_yearly', label: 'Yearly Price', type: 'number', required: true },
        { name: 'max_employees', label: 'Max Employees', type: 'number', required: true },
        { name: 'max_branches', label: 'Max Branches', type: 'number', required: true },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
    ];

    const columns: Column<Plan>[] = [
        {
            header: 'Plan', accessor: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <CreditCard className="text-white" size={24} />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">{row.name}</p>
                        <p className="text-sm text-slate-500">{row.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Pricing', accessor: (row) => (
                <div>
                    <p className="font-medium text-slate-800 flex items-center gap-1">
                        <DollarSign size={14} />
                        {row.price_monthly?.toLocaleString()}/mo
                    </p>
                    <p className="text-sm text-slate-500">
                        ${row.price_yearly?.toLocaleString()}/yr
                    </p>
                </div>
            )
        },
        {
            header: 'Limits', accessor: (row) => (
                <div className="space-y-1">
                    <p className="flex items-center gap-1 text-sm">
                        <Users size={14} className="text-slate-400" />
                        {row.max_employees} employees
                    </p>
                    <p className="flex items-center gap-1 text-sm">
                        <Building2 size={14} className="text-slate-400" />
                        {row.max_branches} branches
                    </p>
                </div>
            )
        },
        {
            header: 'Features', accessor: (row) => (
                <div className="max-w-xs">
                    {row.features?.slice(0, 3).map((feature, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-0.5 rounded mr-1 mb-1">
                            <Check size={10} className="text-green-600" />
                            {feature}
                        </span>
                    ))}
                    {(row.features?.length || 0) > 3 && (
                        <span className="text-xs text-slate-400">+{row.features.length - 3} more</span>
                    )}
                </div>
            )
        },
        {
            header: 'Status', accessor: (row) => (
                row.is_active ? (
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
                    <h2 className="text-2xl font-bold text-slate-800">Subscription Plans</h2>
                    <p className="text-slate-500 text-sm">Manage billing plans and pricing</p>
                </div>
                <button
                    onClick={() => {
                        setEditingPlan(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Plan
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-sm text-slate-500">Active Plans</p>
                    <p className="text-2xl font-bold text-slate-800">{plans.filter(p => p.is_active).length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-sm text-slate-500">Total Plans</p>
                    <p className="text-2xl font-bold text-slate-800">{plans.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-sm text-slate-500">Avg. Monthly Price</p>
                    <p className="text-2xl font-bold text-slate-800">
                        ${plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + (p.price_monthly || 0), 0) / plans.length).toLocaleString() : 0}
                    </p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={plans}
                isLoading={isLoading}
                actions={(row) => (
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingPlan(row); setIsModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded" title="Edit">
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
                    setEditingPlan(null);
                }}
                title={editingPlan ? 'Edit Plan' : 'Create Plan'}
            >
                <DynamicForm
                    fields={formFields}
                    initialValues={editingPlan || { is_active: true, max_employees: 100, max_branches: 5 }}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingPlan(null);
                    }}
                />
            </Modal>
        </div>
    );
};

export default Plans;
