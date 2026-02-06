import React, { useState, useEffect } from 'react';
import { Download, Eye } from 'lucide-react';
import { payrollService } from '../../api/payrollService';
import type { Payslip } from '../../api/payrollService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

const Payslips: React.FC = () => {
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPayslips = async () => {
        setIsLoading(true);
        try {
            const response = await payrollService.getPayslips();
            setPayslips(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch payslips', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayslips();
    }, []);

    const columns: Column<Payslip>[] = [
        { header: 'Employee', accessor: 'employee' },
        { header: 'Period', accessor: (item) => item.payroll_run },
        { header: 'Gross', accessor: (item) => `$${item.gross_salary}` },
        { header: 'Deductions', accessor: (item) => `$${item.total_deductions}` },
        { header: 'Net Payable', accessor: (item) => `$${item.net_salary}` },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Payslips</h1>
                    <p className="text-slate-500">View and download employee payslips</p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={payslips}
                isLoading={isLoading}
                actions={(item) => (
                    <div className="flex justify-end space-x-2">
                        <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <Eye size={18} />
                        </button>
                        {item.pdf_file && (
                            <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                <Download size={18} />
                            </button>
                        )}
                    </div>
                )}
            />
        </div>
    );
};

export default Payslips;
