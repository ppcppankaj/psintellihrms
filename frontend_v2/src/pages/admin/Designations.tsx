import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { employeeService } from '../../api/employeeService';
import type { Designation } from '../../api/employeeService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const Designations: React.FC = () => {
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);

    const fetchDesignations = async () => {
        setIsLoading(true);
        try {
            const response = await employeeService.getDesignations();
            setDesignations(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch designations', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDesignations();
    }, []);

    const columns: Column<Designation>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Code', accessor: 'code' },
        { header: 'Level', accessor: 'level' },
        { header: 'Grade', accessor: 'grade' },
        { header: 'Salary Range', accessor: (d) => d.min_salary && d.max_salary ? `${d.min_salary} - ${d.max_salary}` : '--' },
    ];

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Designation Name', type: 'text', required: true, placeholder: 'e.g. Senior Software Engineer' },
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. SSE' },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Role description' },
        { name: 'level', label: 'Level', type: 'number', required: true, placeholder: 'e.g. 5' },
        { name: 'grade', label: 'Grade', type: 'text', required: true, placeholder: 'e.g. G5' },
        { name: 'job_family', label: 'Job Family', type: 'text', placeholder: 'e.g. Engineering' },
        { name: 'min_salary', label: 'Min Salary', type: 'number', placeholder: '0.00' },
        { name: 'max_salary', label: 'Max Salary', type: 'number', placeholder: '0.00' },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            if (editingDesignation) {
                await employeeService.updateDesignation(editingDesignation.id, values as Partial<Designation>);
            } else {
                await employeeService.createDesignation(values as Partial<Designation>);
            }
            setIsFormOpen(false);
            setEditingDesignation(null);
            fetchDesignations();
        } catch (error) {
            console.error('Failed to save designation', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (designation: Designation) => {
        setEditingDesignation(designation);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this designation?')) {
            try {
                await employeeService.deleteDesignation(id);
                fetchDesignations();
            } catch (error) {
                console.error('Failed to delete designation', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Designations</h1>
                    <p className="text-slate-500">Manage job titles and hierarchy levels</p>
                </div>
                <button
                    onClick={() => { setEditingDesignation(null); setIsFormOpen(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Designation</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {editingDesignation ? 'Edit Designation' : 'New Designation'}
                        </h2>
                        <button
                            onClick={() => { setIsFormOpen(false); setEditingDesignation(null); }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                    <DynamicForm
                        fields={formFields}
                        initialValues={editingDesignation || {}}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        submitLabel={editingDesignation ? 'Update' : 'Create'}
                        onCancel={() => { setIsFormOpen(false); setEditingDesignation(null); }}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={designations}
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

export default Designations;
