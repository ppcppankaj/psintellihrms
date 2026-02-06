import React, { useState, useEffect } from 'react';
import { Plus, Shield, Users, Edit, Trash2, Lock } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { DynamicForm, type FormFieldConfig } from '../../components/DynamicForm';
import { Modal } from '../../components/Modal';
import { abacService } from '../../api/abacService';
import type { Role, Permission } from '../../api/abacService';

const Roles: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const data = await abacService.getRoles();
            setRoles(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch roles', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const data = await abacService.getPermissions();
            setPermissions(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch permissions', error);
        }
    };

    const handleSubmit = async (values: Record<string, unknown>) => {
        try {
            const payload = { ...values, permissions: selectedPermissions };
            if (editingRole) {
                await abacService.updateRole(editingRole.id, payload);
            } else {
                await abacService.createRole(payload);
            }
            setIsModalOpen(false);
            setEditingRole(null);
            setSelectedPermissions([]);
            fetchRoles();
        } catch (error) {
            console.error('Failed to save role', error);
            alert('Failed to save role');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            await abacService.deleteRole(id);
            fetchRoles();
        } catch (error) {
            console.error('Failed to delete role', error);
        }
    };

    const togglePermission = (permId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Role Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'ADMIN_HR' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'is_active', label: 'Active', type: 'checkbox' },
    ];

    const roleColumns: Column<Role>[] = [
        {
            header: 'Role', accessor: (row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${row.is_system_role ? 'bg-purple-100' : 'bg-primary-100'
                        }`}>
                        <Shield className={row.is_system_role ? 'text-purple-600' : 'text-primary-600'} size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{row.name}</p>
                        <p className="text-sm text-slate-500">{row.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Description', accessor: (row) => (
                <span className="text-slate-600">{row.description || '-'}</span>
            )
        },
        {
            header: 'Permissions', accessor: (row) => (
                <span className="bg-slate-100 px-2 py-1 rounded-full text-sm">
                    {row.permissions?.length || 0} permissions
                </span>
            )
        },
        {
            header: 'Type', accessor: (row) => (
                row.is_system_role ? (
                    <span className="flex items-center gap-1 text-purple-600 text-sm">
                        <Lock size={14} /> System
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-slate-600 text-sm">
                        <Users size={14} /> Custom
                    </span>
                )
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

    const permissionColumns: Column<Permission>[] = [
        {
            header: 'Permission', accessor: (row) => (
                <div>
                    <p className="font-medium text-slate-800">{row.name}</p>
                    <p className="text-sm text-slate-500 font-mono">{row.code}</p>
                </div>
            )
        },
        {
            header: 'Resource', accessor: (row) => (
                <span className="capitalize">{row.resource_type?.replace('_', ' ') || '-'}</span>
            )
        },
        {
            header: 'Action', accessor: (row) => (
                <span className="bg-slate-100 px-2 py-1 rounded text-sm capitalize">{row.action}</span>
            )
        },
        { header: 'Description', accessor: 'description' },
    ];

    // Group permissions by resource type
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const resource = perm.resource_type || 'other';
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Roles & Permissions</h2>
                    <p className="text-slate-500 text-sm">Manage user roles and access permissions</p>
                </div>
                {activeTab === 'roles' && (
                    <button
                        onClick={() => {
                            setEditingRole(null);
                            setSelectedPermissions([]);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={18} />
                        Add Role
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`pb-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'roles'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Roles
                    </button>
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={`pb-4 px-1 border-b-2 font-medium transition-colors ${activeTab === 'permissions'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Permissions
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'roles' ? (
                <DataTable
                    columns={roleColumns}
                    data={roles}
                    isLoading={isLoading}
                    actions={(row) => (
                        <div className="flex items-center gap-2">
                            {!row.is_system_role && (
                                <>
                                    <button
                                        onClick={() => {
                                            setEditingRole(row);
                                            setSelectedPermissions(row.permissions || []);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-1 hover:bg-slate-100 rounded"
                                        title="Edit"
                                    >
                                        <Edit size={16} className="text-slate-500" />
                                    </button>
                                    <button onClick={() => handleDelete(row.id)} className="p-1 hover:bg-slate-100 rounded" title="Delete">
                                        <Trash2 size={16} className="text-red-500" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                />
            ) : (
                <DataTable
                    columns={permissionColumns}
                    data={permissions}
                    isLoading={isLoading}
                />
            )}

            {/* Role Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingRole(null);
                    setSelectedPermissions([]);
                }}
                title={editingRole ? 'Edit Role' : 'Create Role'}
            >
                <div className="space-y-6">
                    <DynamicForm
                        fields={formFields}
                        initialValues={editingRole || { is_active: true }}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setIsModalOpen(false);
                            setEditingRole(null);
                            setSelectedPermissions([]);
                        }}
                    />

                    {/* Permission Selection */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium text-slate-700 mb-3">Assign Permissions</h4>
                        <div className="max-h-64 overflow-y-auto space-y-4">
                            {Object.entries(groupedPermissions).map(([resource, perms]) => (
                                <div key={resource}>
                                    <h5 className="text-sm font-medium text-slate-600 capitalize mb-2">
                                        {resource.replace('_', ' ')}
                                    </h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        {perms.map(perm => (
                                            <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="rounded border-slate-300"
                                                />
                                                <span>{perm.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Roles;
