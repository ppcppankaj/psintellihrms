import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { attendanceService } from '../../api/attendanceService';
import type { Shift } from '../../api/attendanceService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const Shifts: React.FC = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    const fetchShifts = async () => {
        setIsLoading(true);
        try {
            const response = await attendanceService.getShifts();
            setShifts(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch shifts', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const columns: Column<Shift>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Code', accessor: 'code' },
        { header: 'Start Time', accessor: 'start_time' },
        { header: 'End Time', accessor: 'end_time' },
        { header: 'Working Hours', accessor: (item) => `${item.working_hours}h` },
    ];

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Shift Name', type: 'text', required: true, placeholder: 'e.g. Morning Shift' },
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. MORN' },
        { name: 'start_time', label: 'Start Time', type: 'text', required: true, placeholder: 'HH:MM:SS' },
        { name: 'end_time', label: 'End Time', type: 'text', required: true, placeholder: 'HH:MM:SS' },
        { name: 'working_hours', label: 'Working Hours', type: 'number', required: true, placeholder: '8.0' },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            if (editingShift) {
                await attendanceService.updateShift(editingShift.id, values as Partial<Shift>);
            } else {
                await attendanceService.createShift(values as Partial<Shift>);
            }
            setIsFormOpen(false);
            setEditingShift(null);
            fetchShifts();
        } catch (error) {
            console.error('Failed to save shift', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (shift: Shift) => {
        setEditingShift(shift);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this shift?')) {
            try {
                await attendanceService.deleteShift(id);
                fetchShifts();
            } catch (error) {
                console.error('Failed to delete shift', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Work Shifts</h1>
                    <p className="text-slate-500">Define work timings and duration</p>
                </div>
                <button
                    onClick={() => { setEditingShift(null); setIsFormOpen(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Shift</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {editingShift ? 'Edit Shift' : 'New Shift'}
                        </h2>
                        <button
                            onClick={() => { setIsFormOpen(false); setEditingShift(null); }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                    <DynamicForm
                        fields={formFields}
                        initialValues={editingShift || {}}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        submitLabel={editingShift ? 'Update' : 'Create'}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={shifts}
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

export default Shifts;
