import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { coreService } from '../../api/coreService';
import type { Organization } from '../../api/coreService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

import { Modal } from '../../components/Modal';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const Organizations: React.FC = () => {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchOrgs = async () => {
        setIsLoading(true);
        try {
            const response = await coreService.getOrganizations();
            setOrgs(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch orgs', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleSubmit = async (values: any) => {
        setIsSaving(true);
        try {
            if (selectedOrg) {
                await coreService.updateOrganization(selectedOrg.id, values);
            } else {
                await coreService.createOrganization(values);
            }
            setIsModalOpen(false);
            setSelectedOrg(null);
            fetchOrgs();
        } catch (error) {
            console.error('Failed to save organization', error);
            alert('Failed to save organization. Please check the inputs.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) return;

        try {
            await coreService.deleteOrganization(id);
            fetchOrgs();
        } catch (error) {
            console.error('Failed to delete organization', error);
            alert('Failed to delete organization.');
        }
    };

    const openCreateModal = () => {
        setSelectedOrg(null);
        setIsModalOpen(true);
    };

    const openEditModal = (org: Organization) => {
        setSelectedOrg(org);
        setIsModalOpen(true);
    };

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Organization Name', type: 'text', required: true },
        { name: 'email', label: 'Contact Email', type: 'email', required: true },
        { name: 'currency', label: 'Currency', type: 'text', required: true, placeholder: 'e.g. USD' },
        { name: 'timezone', label: 'Timezone', type: 'text', required: true, placeholder: 'e.g. UTC' },
        {
            name: 'subscription_status',
            label: 'Subscription Status',
            type: 'select',
            required: true,
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Trial', value: 'trial' },
            ]
        },
    ];

    const columns: Column<Organization>[] = [
        { header: 'Organization Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                    {item.subscription_status.toUpperCase()}
                </span>
            )
        },
        { header: 'Currency', accessor: 'currency' },
        { header: 'Timezone', accessor: 'timezone' },
        {
            header: 'Actions',
            accessor: (item) => (
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => openEditModal(item)}
                        className="text-slate-400 hover:text-primary-600 transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
                    <p className="text-slate-500">Manage global tenants and organization profiles</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Create Organization</span>
                </button>
            </div>

            <DataTable
                columns={columns}
                data={orgs}
                isLoading={isLoading}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedOrg ? "Edit Organization" : "Create Internal Organization"}
            >
                <DynamicForm
                    fields={formFields}
                    initialValues={selectedOrg || {}}
                    onSubmit={handleSubmit}
                    isLoading={isSaving}
                    submitLabel={selectedOrg ? "Update Organization" : "Create Organization"}
                />
            </Modal>
        </div>
    );
};

export default Organizations;
