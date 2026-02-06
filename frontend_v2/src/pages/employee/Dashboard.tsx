import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { attendanceService } from '../../api/attendanceService';
import type { AttendanceRecord } from '../../api/attendanceService';
import { leaveService } from '../../api/leaveService';
import type { LeaveRequest } from '../../api/leaveService';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [attendanceRes, leavesRes] = await Promise.all([
                    attendanceService.getRecords({ limit: 5 }),
                    leaveService.getRequests({ limit: 5 })
                ]);
                setAttendance(attendanceRes.data || (attendanceRes as any).results || []);
                setLeaves(leavesRes.data || (leavesRes as any).results || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.full_name}</h1>
                <p className="text-slate-500 mt-1">Here is what's happening with your profile today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Attendance Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Attendance</h3>
                        <Clock className="text-primary-600" size={24} />
                    </div>
                    {attendance.length > 0 ? (
                        <div>
                            <p className="text-4xl font-bold text-slate-900">{attendance[0].status === 'present' ? 'Present' : 'Absent'}</p>
                            <p className="text-sm text-slate-500 mt-1">Last record: {attendance[0].date}</p>
                        </div>
                    ) : (
                        <p className="text-slate-400 italic">No attendance records yet.</p>
                    )}
                </div>

                {/* Leave Balance Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Recent Leaves</h3>
                        <Calendar className="text-orange-600" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{leaves.length}</p>
                    <p className="text-sm text-slate-500 mt-1">Total requests found</p>
                </div>

                {/* Status Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Account Status</h3>
                        <CheckCircle2 className="text-green-600" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-slate-900">Active</p>
                    <p className="text-sm text-slate-500 mt-1">Verified Profile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Attendance List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-800">Recent Attendance</h2>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-100">
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">In</th>
                                    <th className="px-6 py-3">Out</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {attendance.map((record) => (
                                    <tr key={record.id} className="text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{record.date}</td>
                                        <td className="px-6 py-4">{record.check_in || '--:--'}</td>
                                        <td className="px-6 py-4">{record.check_out || '--:--'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Leaves List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-800">Recent Leave Requests</h2>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-100">
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">From</th>
                                    <th className="px-6 py-3">To</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{leave.leave_type}</td>
                                        <td className="px-6 py-4">{leave.start_date}</td>
                                        <td className="px-6 py-4">{leave.end_date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                leave.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
