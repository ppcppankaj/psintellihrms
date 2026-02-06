import React, { useState, useEffect } from 'react';
import { DynamicForm } from '../../components/DynamicForm';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import type { Employee } from '../../api/employeeService';
import { employeeService } from '../../api/employeeService';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';

const EmployeeManagement: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

    // Option states
    const [departments, setDepartments] = useState<any[]>([]);
    const [designations, setDesignations] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [
                empRes,
                deptRes,
                desigRes,
                locRes
            ] = await Promise.all([
                employeeService.getEmployees(),
                employeeService.getDepartments(),
                employeeService.getDesignations(),
                employeeService.getLocations()
            ]);

            const empList = empRes.data || (empRes as any).results || [];
            setEmployees(empList);
            // Managers are also employees
            setManagers(empList.map((e: Employee) => ({ label: e.full_name || e.employee_id, value: e.id })));

            setDepartments((deptRes.data || (deptRes as any).results || []).map((d: any) => ({ label: d.name, value: d.id })));
            setDesignations((desigRes.data || (desigRes as any).results || []).map((d: any) => ({ label: d.name, value: d.id })));
            setLocations((locRes.data || (locRes as any).results || []).map((l: any) => ({ label: l.name, value: l.id })));

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (values: Record<string, any>) => {
        setIsSubmitting(true);
        try {
            if (editingEmployee) {
                await employeeService.updateEmployee(editingEmployee.id, values as Partial<Employee>);
                alert('Employee updated successfully!');
            } else {
                await employeeService.createEmployee(values as any);
                alert('Employee created successfully!');
            }
            setIsModalOpen(false);
            setEditingEmployee(null);
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error('Failed to save employee', error);
            const errorMessage = error.response?.data?.message || 'Failed to save employee';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (emp: Employee) => {
        // Prepare initial values for the form given the Employee object structure
        // The form expects IDs for select fields, but the API might return objects
        const initialValues = {
            ...emp,
            department: typeof emp.department === 'object' ? emp.department?.id : emp.department,
            designation: typeof emp.designation === 'object' ? emp.designation?.id : emp.designation,
            reporting_manager: typeof emp.reporting_manager === 'object' ? (emp.reporting_manager as any)?.id : emp.reporting_manager,
            // Add other transformations if needed
        };
        setEditingEmployee(initialValues);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            try {
                await employeeService.deleteEmployee(id);
                fetchData();
            } catch (error) {
                console.error('Failed to delete employee', error);
                alert('Failed to delete employee');
            }
        }
    };

    const getFormFields = () => [
        // Personal Information
        { name: 'first_name', label: 'First Name', type: 'text' as const, required: !editingEmployee, placeholder: 'John' },
        { name: 'last_name', label: 'Last Name', type: 'text' as const, required: true, placeholder: 'Doe' },
        { name: 'email', label: 'Email', type: 'email' as const, required: true, placeholder: 'john.doe@company.com', readOnly: !!editingEmployee },
        { name: 'phone', label: 'Phone', type: 'text' as const, placeholder: '+1234567890' },
        // Password only required for creation
        ...(editingEmployee ? [] : [{ name: 'password', label: 'Password', type: 'password' as const, required: true, placeholder: '********' }]),
        { name: 'date_of_birth', label: 'Date of Birth', type: 'date' as const },
        {
            name: 'gender', label: 'Gender', type: 'select' as const, options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' }
            ]
        },
        {
            name: 'marital_status', label: 'Marital Status', type: 'select' as const, options: [
                { label: 'Single', value: 'single' },
                { label: 'Married', value: 'married' },
                { label: 'Divorced', value: 'divorced' },
                { label: 'Widowed', value: 'widowed' }
            ]
        },
        { name: 'blood_group', label: 'Blood Group', type: 'text' as const, placeholder: 'O+' },

        // Job Details
        { name: 'employee_id', label: 'Employee ID', type: 'text' as const, required: true, placeholder: 'EMP-001', readOnly: !!editingEmployee },
        { name: 'department', label: 'Department', type: 'select' as const, options: departments, required: true },
        { name: 'designation', label: 'Designation', type: 'select' as const, options: designations, required: true },
        { name: 'location', label: 'Location', type: 'select' as const, options: locations, required: true },
        { name: 'reporting_manager', label: 'Reporting Manager', type: 'select' as const, options: managers },
        { name: 'date_of_joining', label: 'Date of Joining', type: 'date' as const, required: true },

        // Employment Details
        {
            name: 'employment_type', label: 'Employment Type', type: 'select' as const, options: [
                { label: 'Full Time', value: 'full_time' },
                { label: 'Part Time', value: 'part_time' },
                { label: 'Contract', value: 'contract' },
                { label: 'Intern', value: 'intern' },
                { label: 'Consultant', value: 'consultant' }
            ], required: true
        },
        {
            name: 'employment_status', label: 'Status', type: 'select' as const, options: [
                { label: 'Active', value: 'active' },
                { label: 'Probation', value: 'probation' },
                { label: 'Notice Period', value: 'notice_period' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Terminated', value: 'terminated' }
            ], required: true
        },
    ];

    const columns: Column<Employee>[] = [
        { header: 'Employee ID', accessor: 'employee_id', className: 'font-mono text-xs' },
        { header: 'Name', accessor: (emp) => emp.full_name || 'Unknown' },
        { header: 'Department', accessor: (emp) => emp.department_name || '--' },
        { header: 'Designation', accessor: (emp) => emp.designation_name || '--' },
        { header: 'Joining Date', accessor: 'date_of_joining' },
        {
            header: 'Status',
            accessor: (emp) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.employment_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {emp.employment_status}
                </span>
            )
        },
    ];

    const actions = (emp: Employee) => (
        <div className="flex items-center justify-end space-x-2">
            <button
                onClick={() => handleEdit(emp)}
                className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
            >
                <Edit2 size={16} />
            </button>
            <button
                onClick={() => handleDelete(emp.id)}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Employee Directory</h2>
                    <p className="text-slate-500 text-sm">Manage and view all staff records across the organization.</p>
                </div>
                <button
                    onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                >
                    <UserPlus size={20} />
                    <span>Add Employee</span>
                </button>
            </div>

            <DataTable
                columns={columns}
                data={employees}
                isLoading={isLoading}
                onSearch={(query) => console.log('Searching for:', query)}
                actions={actions}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Register New Employee"
            >
                <div className="p-1">
                    <p className="text-slate-500 text-sm mb-6">Complete the information below to add a new employee to the system. Fields marked with * are required.</p>
                    <DynamicForm
                        fields={getFormFields()}
                        initialValues={editingEmployee || {}}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitLabel={editingEmployee ? 'Update Employee' : 'Create Employee'}
                        onCancel={() => { setIsModalOpen(false); setEditingEmployee(null); }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default EmployeeManagement;
