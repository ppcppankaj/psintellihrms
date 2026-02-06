import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import type { Holiday } from '../../api/leaveService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const Holidays: React.FC = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

    const fetchHolidays = async () => {
        setIsLoading(true);
        try {
            const response = await leaveService.getHolidays();
            setHolidays(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch holidays', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const columns: Column<Holiday>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Date', accessor: 'date' },
        {
            header: 'Type',
            accessor: (item) => item.is_optional ? 'Optional' : 'Public'
        },
    ];

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Holiday Name', type: 'text', required: true, placeholder: 'e.g. Independence Day' },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'is_optional', label: 'Optional Holiday', type: 'checkbox' },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            if (editingHoliday) {
                await leaveService.updateHoliday(editingHoliday.id, values as Partial<Holiday>);
            } else {
                await leaveService.createHoliday(values as Partial<Holiday>);
            }
            setIsFormOpen(false);
            setEditingHoliday(null);
            fetchHolidays();
        } catch (error) {
            console.error('Failed to save holiday', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (holiday: Holiday) => {
        setEditingHoliday(holiday);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this holiday?')) {
            try {
                await leaveService.deleteHoliday(id);
                fetchHolidays();
            } catch (error) {
                console.error('Failed to delete holiday', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Holiday Calendar</h1>
                    <p className="text-slate-500">Manage public and optional holidays</p>
                </div>
                <button
                    onClick={() => { setEditingHoliday(null); setIsFormOpen(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Holiday</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {editingHoliday ? 'Edit Holiday' : 'New Holiday'}
                        </h2>
                        <button
                            onClick={() => { setIsFormOpen(false); setEditingHoliday(null); }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                    <DynamicForm
                        fields={formFields}
                        initialValues={editingHoliday || {}}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        submitLabel={editingHoliday ? 'Update' : 'Create'}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={holidays}
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

export default Holidays;
