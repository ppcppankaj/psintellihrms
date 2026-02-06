import React, { useState, useEffect } from 'react';
import { Plus, Play, CheckCircle2, Lock } from 'lucide-react';
import { payrollService } from '../../api/payrollService';
import type { PayrollRun } from '../../api/payrollService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { DynamicForm } from '../../components/DynamicForm';
import type { FormFieldConfig } from '../../components/DynamicForm';

const PayrollRuns: React.FC = () => {
    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchRuns = async () => {
        setIsLoading(true);
        try {
            const response = await payrollService.getPayrollRuns();
            setRuns(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch payroll runs', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRuns();
    }, []);

    const columns: Column<PayrollRun>[] = [
        { header: 'Name', accessor: 'name' },
        {
            header: 'Period',
            accessor: (item) => `${new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long' })} ${item.year}`
        },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-700' :
                        item.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                            'bg-amber-100 text-amber-700'
                    }`}>
                    {item.status.toUpperCase()}
                </span>
            )
        },
        { header: 'Employees', accessor: 'total_employees' },
        { header: 'Total Net', accessor: (item) => `$${item.total_net}` },
    ];

    const formFields: FormFieldConfig[] = [
        { name: 'name', label: 'Run Name', type: 'text', required: true, placeholder: 'e.g. Jan 2026 Regular' },
        { name: 'month', label: 'Month', type: 'number', required: true, placeholder: '1-12' },
        { name: 'year', label: 'Year', type: 'number', required: true, placeholder: '2026' },
        { name: 'pay_date', label: 'Tentative Pay Date', type: 'date', required: true },
    ];

    const handleSubmit = async (values: Record<string, any>) => {
        setIsLoading(true);
        try {
            await payrollService.createPayrollRun(values as Partial<PayrollRun>);
            setIsFormOpen(false);
            fetchRuns();
        } catch (error) {
            console.error('Failed to create payroll run', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcess = async (id: string) => {
        try {
            await payrollService.processPayroll(id);
            fetchRuns();
        } catch (error) {
            console.error('Failed to process payroll', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Payroll Runs</h1>
                    <p className="text-slate-500">Manage monthly salary processing and approvals</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>New Payroll Run</span>
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">New Payroll Run</h2>
                        <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">Cancel</button>
                    </div>
                    <DynamicForm
                        fields={formFields}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={runs}
                    isLoading={isLoading}
                    actions={(item) => (
                        <div className="flex justify-end space-x-2">
                            {item.status === 'draft' && (
                                <button
                                    onClick={() => handleProcess(item.id)}
                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Process"
                                >
                                    <Play size={18} />
                                </button>
                            )}
                            {item.status === 'processed' && (
                                <button
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Approve"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                            )}
                            {item.status === 'approved' && (
                                <button
                                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                    title="Lock"
                                >
                                    <Lock size={18} />
                                </button>
                            )}
                        </div>
                    )}
                />
            )}
        </div>
    );
};

export default PayrollRuns;
