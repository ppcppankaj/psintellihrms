import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

const MyLeaves: React.FC = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMyLeaves = async () => {
        setIsLoading(true);
        try {
            const response = await leaveService.getRequests();
            setRequests(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyLeaves();
    }, []);

    const columns: Column<any>[] = [
        { header: 'Type', accessor: 'leave_type_name' },
        { header: 'Starts', accessor: 'start_date' },
        { header: 'Ends', accessor: 'end_date' },
        { header: 'Days', accessor: 'days' },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'approved' ? 'bg-green-100 text-green-700' :
                    item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
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
                    <h1 className="text-2xl font-bold text-slate-900">My Leaves</h1>
                    <p className="text-slate-500">Manage your time off and leave balances</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Plus size={20} />
                    <span>Apply for Leave</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Annual Leave', total: 20, used: 12, color: 'text-primary-600' },
                    { label: 'Sick Leave', total: 10, used: 2, color: 'text-amber-600' },
                    { label: 'Personal Leave', total: 5, used: 0, color: 'text-slate-600' },
                    { label: 'Remaining Total', total: 35, used: 14, color: 'text-green-600' },
                ].map((balance) => (
                    <div key={balance.label} className="p-6 bg-white border border-slate-200 rounded-xl text-center">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{balance.label}</p>
                        <h3 className={`text-2xl font-bold ${balance.color}`}>{balance.total - balance.used}</h3>
                        <p className="text-slate-400 text-xs mt-1">out of {balance.total} total</p>
                    </div>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={requests}
                isLoading={isLoading}
            />
        </div>
    );
};

export default MyLeaves;
