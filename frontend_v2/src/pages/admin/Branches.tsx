import React, { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Phone, Mail, Globe, Edit, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import { Modal } from '../../components/Modal';
import { coreService } from '../../api/coreService';

interface Branch {
    id: string;
    name: string;
    code: string;
    organization?: string;
    organization_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    timezone?: string;
    is_headquarters?: boolean;
    is_active?: boolean;
}

const Branches: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setIsLoading(true);
            const data = await coreService.getBranches();
            setBranches(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (values: Record<string, unknown>) => {
        try {
            if (editingBranch) {
                await coreService.updateBranch(editingBranch.id, values);
            } else {
                await coreService.createBranch(values);
            }
            setIsModalOpen(false);
            setEditingBranch(null);
            fetchBranches();
        } catch (error) {
            console.error('Failed to save branch', error);
            alert('Failed to save branch');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this branch?')) return;
        try {
            await coreService.deleteBranch(id);
            fetchBranches();
        } catch (error) {
            console.error('Failed to delete branch', error);
        }
    };

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Branch Name', type: 'text', required: true },
        { name: 'code', label: 'Branch Code', type: 'text', required: true, placeholder: 'HQ-001' },
        { name: 'address_line1', label: 'Address Line 1', type: 'text' },
        { name: 'address_line2', label: 'Address Line 2', type: 'text' },
        { name: 'city', label: 'City', type: 'text' },
        { name: 'state', label: 'State/Province', type: 'text' },
        { name: 'country', label: 'Country', type: 'text' },
        { name: 'postal_code', label: 'Postal Code', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        {
            name: 'timezone', label: 'Timezone', type: 'select', options: [
                { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                { value: 'America/New_York', label: 'America/New_York (EST)' },
                { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
                { value: 'Europe/London', label: 'Europe/London (GMT)' },
                { value: 'UTC', label: 'UTC' },
            ]
        },
        { name: 'is_headquarters', label: 'Headquarters', type: 'checkbox' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
    ];

    const columns: Column<Branch>[] = [
        {
            header: 'Branch', accessor: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <Building2 className="text-white" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{row.name}</p>
                        <p className="text-sm text-slate-500">{row.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Location', accessor: (row) => (
                <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 mt-0.5" />
                    <div>
                        <p className="text-slate-700">{row.city || 'N/A'}{row.state ? `, ${row.state}` : ''}</p>
                        <p className="text-sm text-slate-500">{row.country || ''}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Contact', accessor: (row) => (
                <div className="space-y-1">
                    {row.phone && (
                        <p className="flex items-center gap-1 text-sm text-slate-600">
                            <Phone size={12} /> {row.phone}
                        </p>
                    )}
                    {row.email && (
                        <p className="flex items-center gap-1 text-sm text-slate-600">
                            <Mail size={12} /> {row.email}
                        </p>
                    )}
                    {!row.phone && !row.email && <span className="text-slate-400">-</span>}
                </div>
            )
        },
        {
            header: 'Timezone', accessor: (row) => (
                <span className="flex items-center gap-1 text-slate-600">
                    <Globe size={14} />
                    {row.timezone || 'UTC'}
                </span>
            )
        },
        {
            header: 'Type', accessor: (row) => (
                row.is_headquarters ? (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                        HQ
                    </span>
                ) : (
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
                        Branch
                    </span>
                )
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
                    <h2 className="text-2xl font-bold text-slate-800">Branches</h2>
                    <p className="text-slate-500 text-sm">Manage organization branches and locations</p>
                </div>
                <button
                    onClick={() => {
                        setEditingBranch(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Branch
                </button>
            </div>

            <DataTable
                columns={columns}
                data={branches}
                isLoading={isLoading}
                actions={(row) => (
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingBranch(row); setIsModalOpen(true); }} className="p-1 hover:bg-slate-100 rounded" title="Edit">
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
                    setEditingBranch(null);
                }}
                title={editingBranch ? 'Edit Branch' : 'Add Branch'}
            >
                <DynamicForm
                    fields={formFields}
                    initialValues={editingBranch || { is_active: true }}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingBranch(null);
                    }}
                />
            </Modal>
        </div>
    );
};

export default Branches;
