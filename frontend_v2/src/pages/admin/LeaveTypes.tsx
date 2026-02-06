import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import type { LeaveType } from '../../api/leaveService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const LeaveTypes: React.FC = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingType, setEditingType] = useState<LeaveType | null>(null);

    const fetchLeaveTypes = async () => {
        setIsLoading(true);
        try {
            const response = await leaveService.getLeaveTypes();
            setLeaveTypes(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch leave types', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const columns: Column<LeaveType>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Annual Count', accessor: (item) => `${item.count} days` },
    ];

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Leave Type Name', type: 'text', required: true, placeholder: 'e.g. Sick Leave' },
        { name: 'count', label: 'Annual Limit (Days)', type: 'number', required: true, placeholder: 'e.g. 12' },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            if (editingType) {
                await leaveService.updateLeaveType(editingType.id, values as Partial<LeaveType>);
            } else {
                await leaveService.createLeaveType(values as Partial<LeaveType>);
            }
            setIsFormOpen(false);
            setEditingType(null);
            fetchLeaveTypes();
        } catch (error) {
            console.error('Failed to save leave type', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (type: LeaveType) => {
        setEditingType(type);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this leave type?')) {
            try {
                await leaveService.deleteLeaveType(id);
                fetchLeaveTypes();
            } catch (error) {
                console.error('Failed to delete leave type', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leave Types</h1>
                    <p className="text-slate-500">Configure different categories of time off</p>
                </div>
                <button
                    onClick={() => { setEditingType(null); setIsFormOpen(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Leave Type</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {editingType ? 'Edit Leave Type' : 'New Leave Type'}
                        </h2>
                        <button
                            onClick={() => { setIsFormOpen(false); setEditingType(null); }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                    <DynamicForm
                        fields={formFields}
                        initialValues={editingType || {}}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        submitLabel={editingType ? 'Update' : 'Create'}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={leaveTypes}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                />
            )}
        </div>
    );
};

export default LeaveTypes;
