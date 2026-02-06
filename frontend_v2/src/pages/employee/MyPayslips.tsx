import React, { useState, useEffect } from 'react';
import { Download, Eye, DollarSign } from 'lucide-react';
import { payrollService } from '../../api/payrollService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

const MyPayslips: React.FC = () => {
    const [payslips, setPayslips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMyPayslips = async () => {
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
        fetchMyPayslips();
    }, []);

    const columns: Column<any>[] = [
        { header: 'Period', accessor: 'period_display' },
        { header: 'Net Salary', accessor: (item) => `${item.currency || '$'} ${item.net_salary}` },
        { header: 'Gross Salary', accessor: (item) => `${item.currency || '$'} ${item.gross_salary}` },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                    {item.status?.toUpperCase()}
                </span>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Payslips</h1>
                    <p className="text-slate-500">View and download your monthly salary statements</p>
                </div>
            </div>

            <div className="bg-primary-600 rounded-xl p-8 text-white flex justify-between items-center shadow-lg shadow-primary-500/20">
                <div>
                    <h3 className="text-primary-100 text-sm font-medium uppercase tracking-widest mb-2">Total Earnings - YTD</h3>
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <DollarSign size={32} />
                        </div>
                        <h2 className="text-4xl font-bold">$125,400.00</h2>
                    </div>
                </div>
                <button className="px-6 py-3 bg-white text-primary-600 rounded-lg font-bold hover:bg-primary-50 transition-colors">
                    Download Annual Summary
                </button>
            </div>

            <DataTable
                columns={columns}
                data={payslips}
                isLoading={isLoading}
                actions={() => (
                    <div className="flex space-x-2">
                        <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="View Details">
                            <Eye size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Download PDF">
                            <Download size={18} />
                        </button>
                    </div>
                )}
            />
        </div>
    );
};

export default MyPayslips;
