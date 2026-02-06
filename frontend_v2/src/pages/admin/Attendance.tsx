import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { attendanceService } from '../../api/attendanceService';
import type { AttendanceRecord } from '../../api/attendanceService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

const Attendance: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: ''
    });

    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const response = await attendanceService.getRecords(filters);
            setRecords(response.data || (response as any).results || []);
        } catch (error) {
            console.error('Failed to fetch attendance records', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [filters]);

    const columns: Column<AttendanceRecord>[] = [
        { header: 'Employee', accessor: 'employee' },
        { header: 'Date', accessor: 'date' },
        {
            header: 'Check In',
            accessor: (item) => item.check_in ? new Date(item.check_in).toLocaleTimeString() : '-'
        },
        {
            header: 'Check Out',
            accessor: (item) => item.check_out ? new Date(item.check_out).toLocaleTimeString() : '-'
        },
        { header: 'Total Hours', accessor: (item) => `${item.total_hours || '0'}h` },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'present' ? 'bg-green-100 text-green-700' :
                    item.status === 'absent' ? 'bg-red-100 text-red-700' :
                        item.status === 'late' ? 'bg-amber-100 text-amber-700' :
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
                    <h1 className="text-2xl font-bold text-slate-900">Attendance Logs</h1>
                    <p className="text-slate-500">Monitor daily punch-in/out and working hours</p>
                </div>
                <div className="flex space-x-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="">All Status</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="on_leave">On Leave</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={records}
                isLoading={isLoading}
            />
        </div>
    );
};

export default Attendance;
