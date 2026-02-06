import React, { useEffect, useState } from 'react';
import { employeeService } from '../../api/employeeService';
import { leaveService } from '../../api/leaveService';
import { attendanceService } from '../../api/attendanceService';
import { Users, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        employees: 0,
        pendingLeaves: 0,
        attendanceToday: 0,
        openTasks: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const [employeesRes, leavesRes, attendanceRes] = await Promise.all([
                    employeeService.getEmployees({ page_size: 1 }),
                    leaveService.getRequests({ status: 'pending', page_size: 1 }),
                    attendanceService.getRecords({ date: new Date().toISOString().split('T')[0], page_size: 1 })
                ]);

                setStats({
                    employees: employeesRes.pagination?.count ?? (employeesRes as any).count ?? 0,
                    pendingLeaves: leavesRes.pagination?.count ?? (leavesRes as any).count ?? 0,
                    attendanceToday: attendanceRes.pagination?.count ?? (attendanceRes as any).count ?? 0,
                    openTasks: 5 // Mock for now until Task API integrated
                });
            } catch (error) {
                console.error('Failed to fetch admin stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdminStats();
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
                <h1 className="text-3xl font-bold text-slate-900">Admin Overview</h1>
                <p className="text-slate-500 mt-1">Manage your organization's workforce and operations.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-primary-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Employees</h3>
                        <Users className="text-primary-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{stats.employees}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-orange-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Pending Leaves</h3>
                        <Calendar className="text-orange-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{stats.pendingLeaves}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-green-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Attendance Today</h3>
                        <Clock className="text-green-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{stats.attendanceToday}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Pending Tasks</h3>
                        <CheckCircle2 className="text-blue-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{stats.openTasks}</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Operational Status</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Payroll Generation</span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Ready</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Compliance Audit</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">Scheduled</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
