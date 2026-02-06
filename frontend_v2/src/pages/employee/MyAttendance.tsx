import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { attendanceService } from '../../api/attendanceService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

const MyAttendance: React.FC = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [todayRecord, setTodayRecord] = useState<any>(null);

    const fetchMyAttendance = async () => {
        setIsLoading(true);
        try {
            const response = await attendanceService.getRecords();
            const data = response.data || (response as any).results || [];
            setRecords(data);

            // Find today's record
            const today = new Date().toISOString().split('T')[0];
            const todayRec = data.find((r: any) => r.date === today);
            setTodayRecord(todayRec);
        } catch (error) {
            console.error('Failed to fetch attendance', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePunch = async () => {
        setIsLoading(true);
        try {
            if (!todayRecord || !todayRecord.check_in) {
                // Clock In
                await attendanceService.checkIn({ latitude: 0, longitude: 0 });
            } else if (!todayRecord.check_out) {
                // Clock Out
                await attendanceService.checkOut({ latitude: 0, longitude: 0 });
            }
            await fetchMyAttendance();
        } catch (error) {
            console.error('Punch failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyAttendance();
    }, []);

    const columns: Column<any>[] = [
        { header: 'Date', accessor: 'date' },
        { header: 'Check In', accessor: 'check_in' },
        { header: 'Check Out', accessor: 'check_out' },
        {
            header: 'Hours',
            accessor: (item) => item.total_hours ? `${item.total_hours}h` : '-'
        },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {item.status?.toUpperCase()}
                </span>
            )
        },
    ];

    const isClockedIn = todayRecord && todayRecord.check_in && !todayRecord.check_out;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
                    <p className="text-slate-500">Track your daily work hours and status</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handlePunch}
                        disabled={isLoading || (todayRecord && todayRecord.check_out)}
                        className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${isClockedIn
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-primary-600 hover:bg-primary-700'
                            } disabled:opacity-50`}
                    >
                        <Clock size={20} />
                        <span>{isClockedIn ? 'Clock Out Now' : 'Clock In Now'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500 text-sm font-medium mb-1">Average Daily Hours</p>
                    <h3 className="text-2xl font-bold text-slate-900">8.5h</h3>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500 text-sm font-medium mb-1">On-time Attendance</p>
                    <h3 className="text-2xl font-bold text-green-600">98%</h3>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500 text-sm font-medium mb-1">Missing Check-outs</p>
                    <h3 className="text-2xl font-bold text-slate-900">0</h3>
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

export default MyAttendance;
