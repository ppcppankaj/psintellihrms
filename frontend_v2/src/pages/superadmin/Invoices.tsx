import React, { useState, useEffect } from 'react';
import { FileText, Download, DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { billingService } from '../../api/billingService';
import type { Invoice } from '../../api/billingService';

const Invoices: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            const data = await billingService.getInvoices();
            setInvoices(data.results || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (id: string) => {
        try {
            const blob = await billingService.downloadInvoice(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download invoice', error);
            alert('Failed to download invoice');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            paid: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={14} /> },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={14} /> },
            overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle size={14} /> },
            cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', icon: null },
        };
        const style = styles[status] || styles.pending;
        return (
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
                {style.icon}
                <span className="capitalize">{status}</span>
            </span>
        );
    };

    const filteredInvoices = filter === 'all'
        ? invoices
        : invoices.filter(inv => inv.status === filter);

    const totals = {
        all: invoices.length,
        pending: invoices.filter(i => i.status === 'pending').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        overdue: invoices.filter(i => i.status === 'overdue').length,
    };

    const columns: Column<Invoice>[] = [
        {
            header: 'Invoice', accessor: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FileText className="text-slate-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{row.invoice_number}</p>
                        <p className="text-sm text-slate-500">{row.organization}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Billing Period', accessor: (row) => (
                <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Calendar size={14} />
                    {new Date(row.billing_period_start).toLocaleDateString()} - {new Date(row.billing_period_end).toLocaleDateString()}
                </div>
            )
        },
        {
            header: 'Amount', accessor: (row) => (
                <div>
                    <p className="font-medium text-slate-800 flex items-center gap-1">
                        <DollarSign size={14} />
                        {row.total?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                        (Tax: ${row.tax?.toLocaleString()})
                    </p>
                </div>
            )
        },
        {
            header: 'Due Date', accessor: (row) => (
                <span className={`text-sm ${new Date(row.due_date) < new Date() && row.status !== 'paid'
                        ? 'text-red-600 font-medium'
                        : 'text-slate-600'
                    }`}>
                    {new Date(row.due_date).toLocaleDateString()}
                </span>
            )
        },
        { header: 'Status', accessor: (row) => getStatusBadge(row.status) },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Invoices</h2>
                    <p className="text-slate-500 text-sm">View and manage billing invoices</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['all', 'pending', 'paid', 'overdue'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`bg-white rounded-xl p-4 border transition-colors text-left ${filter === status ? 'border-primary-500 ring-2 ring-primary-100' : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <p className="text-sm text-slate-500 capitalize">{status}</p>
                        <p className="text-2xl font-bold text-slate-800">{totals[status]}</p>
                    </button>
                ))}
            </div>

            {/* Revenue Summary */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-primary-200 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold">
                            ${invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-primary-200 text-sm">Pending Amount</p>
                        <p className="text-3xl font-bold">
                            ${invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-primary-200 text-sm">Overdue Amount</p>
                        <p className="text-3xl font-bold">
                            ${invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredInvoices}
                isLoading={isLoading}
                actions={(row) => (
                    <button
                        onClick={() => handleDownload(row.id)}
                        className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm"
                    >
                        <Download size={16} />
                        Download
                    </button>
                )}
            />
        </div>
    );
};

export default Invoices;
