import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { leaveService } from '../../api/leaveService';
import type { LeaveRequest } from '../../api/leaveService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

const LeaveRequests: React.FC = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
    });

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await leaveService.getRequests(filters);
            setRequests(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch leave requests', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filters]);

    const handleApprove = async (id: string) => {
        if (window.confirm('Approve this leave request?')) {
            try {
                await leaveService.approveRequest(id);
                fetchRequests();
            } catch (error) {
                console.error('Failed to approve request', error);
            }
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Reason for rejection:');
        if (reason !== null) {
            try {
                await leaveService.rejectRequest(id, reason);
                fetchRequests();
            } catch (error) {
                console.error('Failed to reject request', error);
            }
        }
    };

    const columns: Column<LeaveRequest>[] = [
        { header: 'Employee', accessor: 'employee' },
        { header: 'Type', accessor: 'leave_type' },
        { header: 'Start Date', accessor: 'start_date' },
        { header: 'End Date', accessor: 'end_date' },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'approved' ? 'bg-green-100 text-green-700' :
                    item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                    }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leave Requests</h1>
                    <p className="text-slate-500">Review and manage employee leave applications</p>
                </div>
                <div className="flex space-x-3">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={requests}
                isLoading={isLoading}
                actions={(item) => item.status === 'pending' ? (
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => handleApprove(item.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={() => handleReject(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : null}
            />
        </div>
    );
};

export default LeaveRequests;
