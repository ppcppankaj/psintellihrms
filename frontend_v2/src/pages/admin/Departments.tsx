import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { employeeService } from '../../api/employeeService';
import type { Department } from '../../api/employeeService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const Departments: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);

    // Options
    const [deptOptions, setDeptOptions] = useState<any[]>([]);
    const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
    const [locationOptions, setLocationOptions] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [deptRes, empRes, locRes] = await Promise.all([
                employeeService.getDepartments(),
                employeeService.getEmployees(),
                employeeService.getLocations(),
            ]);

            const depts = deptRes.data || (deptRes as any).results || [];
            setDepartments(depts);
            setDeptOptions(depts.map((d: any) => ({ label: d.name, value: d.id })));

            const emps = empRes.data || (empRes as any).results || [];
            setEmployeeOptions(emps.map((e: any) => ({ label: e.user || e.employee_id, value: e.id })));

            const locs = locRes.data || (locRes as any).results || [];
            setLocationOptions(locs.map((l: any) => ({ label: l.name, value: l.id })));

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns: Column<Department>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Code', accessor: 'code' },
        { header: 'Parent Dept', accessor: (d) => d.parent_name || '--' },
        { header: 'Dept Head', accessor: (d) => d.head_name || '--' },
        { header: 'Description', accessor: 'description' },
    ];

    const getFormFields = (): FormFieldConfig[] => [
        { name: 'name', label: 'Department Name', type: 'text', required: true, placeholder: 'e.g. Engineering' },
        { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. ENG' },
        { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief description of the department' },
        { name: 'parent', label: 'Parent Department', type: 'select', options: deptOptions },
        { name: 'head', label: 'Department Head', type: 'select', options: employeeOptions },
        { name: 'branch', label: 'Branch / Location', type: 'select', options: locationOptions },
        { name: 'cost_center', label: 'Cost Center', type: 'text', placeholder: 'CC-001' },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            if (editingDept) {
                await employeeService.updateDepartment(editingDept.id, values as Partial<Department>);
            } else {
                await employeeService.createDepartment(values as Partial<Department>);
            }
            setIsFormOpen(false);
            setEditingDept(null);
            fetchData();
        } catch (error) {
            console.error('Failed to save department', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await employeeService.deleteDepartment(id);
                fetchData();
            } catch (error) {
                console.error('Failed to delete department', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
                    <p className="text-slate-500">Manage your organization's vertical structure</p>
                </div>
                <button
                    onClick={() => { setEditingDept(null); setIsFormOpen(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Department</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {editingDept ? 'Edit Department' : 'New Department'}
                        </h2>
                        <button
                            onClick={() => { setIsFormOpen(false); setEditingDept(null); }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                    <DynamicForm
                        fields={getFormFields()}
                        initialValues={editingDept || {}}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        submitLabel={editingDept ? 'Update' : 'Create'}
                        onCancel={() => { setIsFormOpen(false); setEditingDept(null); }}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={departments}
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

export default Departments;
