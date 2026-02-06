import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { userService } from '../../api/userService';
import type { User } from '../../api/userService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

import { coreService } from '../../api/coreService';
import { Modal } from '../../components/Modal';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const GlobalUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [orgs, setOrgs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await userService.getUsers();
            setUsers((response as any).data || response.results || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrgs = async () => {
        try {
            const response = await coreService.getOrganizations();
            setOrgs(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch organizations', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchOrgs();
    }, []);

    const handleSubmit = async (values: any) => {
        setIsSaving(true);
        try {
            if (selectedUser) {
                // If editing, we might not want to send passwords if they are empty
                const updateData = { ...values };
                if (!updateData.password) {
                    delete updateData.password;
                    delete updateData.password_confirm;
                }
                await userService.updateUser(selectedUser.id, updateData);
            } else {
                await userService.createUser(values);
            }
            setIsModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to save user', error);
            alert('Failed to save user. Please check if email/username is unique and passwords match.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userService.deleteUser(id);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Failed to delete user.');
        }
    };

    const openCreateModal = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const formFields: FormFieldConfig[] = [
        { name: 'username', label: 'Username', type: 'text', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { name: 'employee_id', label: 'Employee ID', type: 'text', required: true },
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'middle_name', label: 'Middle Name', type: 'text' },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        {
            name: 'gender',
            label: 'Gender',
            type: 'select',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
                { label: 'Prefer not to say', value: 'prefer_not_to_say' }
            ]
        },
        { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
        { name: 'phone', label: 'Phone Number', type: 'text' },
        {
            name: 'organization',
            label: 'Organization',
            type: 'select',
            required: true,
            options: orgs.map(org => ({ label: org.name, value: org.id }))
        },
        {
            name: 'is_org_admin',
            label: 'Grant Organization Admin Privileges',
            type: 'checkbox',
            required: false,
        },
        {
            name: 'password',
            label: selectedUser ? 'New Password (leave blank to keep current)' : 'Password',
            type: 'password',
            required: !selectedUser
        },
        {
            name: 'password_confirm',
            label: 'Confirm Password',
            type: 'password',
            required: !selectedUser
        },
    ];

    const columns: Column<User>[] = [
        { header: 'Employee ID', accessor: 'employee_id' },
        { header: 'Username', accessor: 'username' },
        { header: 'Email', accessor: 'email' },
        { header: 'Full Name', accessor: (item) => `${item.first_name} ${item.last_name}` },
        {
            header: 'Organization',
            accessor: (item) => item.organization?.name || 'Platform'
        },
        {
            header: 'Role',
            accessor: (item) => (
                <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-semibold">
                    {item.role || (item.roles && item.roles[0]) || 'User'}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`w-2 h-2 rounded-full inline-block mr-2 ${item.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
            )
        },
        { header: 'Last Login', accessor: (item) => item.last_login ? new Date(item.last_login).toLocaleDateString() : 'Never' },
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
                    <h1 className="text-2xl font-bold text-slate-900">Global Users</h1>
                    <p className="text-slate-500">Manage all administrative and system users</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Create User</span>
                </button>
            </div>

            <DataTable
                columns={columns}
                data={users}
                isLoading={isLoading}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedUser ? "Edit Platform User" : "Create Platform User"}
            >
                <DynamicForm
                    fields={formFields}
                    initialValues={selectedUser ? {
                        ...selectedUser,
                        organization: selectedUser.organization?.id || selectedUser.organization
                    } : {}}
                    onSubmit={handleSubmit}
                    isLoading={isSaving}
                    submitLabel={selectedUser ? "Update User" : "Create User"}
                />
            </Modal>
        </div>
    );
};

export default GlobalUsers;
