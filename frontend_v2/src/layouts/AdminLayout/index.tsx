import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../shared/Sidebar';
import { Header } from '../shared/Header';
import {
    LayoutDashboard,
    Users,
    Building2,
    Briefcase,
    MapPin,
    Calendar,
    Clock,
    CreditCard,
    Package,
    CheckCircle2,
    Bell,
    Shield,
    TrendingUp
} from 'lucide-react';

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const sidebarItems = [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/employees', icon: Users, label: 'Employees' },
        { to: '/admin/departments', icon: Building2, label: 'Departments' },
        { to: '/admin/designations', icon: Briefcase, label: 'Designations' },
        { to: '/admin/locations', icon: MapPin, label: 'Locations' },
        { to: '/admin/attendance', icon: Clock, label: 'Attendance' },
        { to: '/admin/shifts', icon: Clock, label: 'Shifts' },
        { to: '/admin/geo-fences', icon: MapPin, label: 'GeoFences' },
        { to: '/admin/leaves', icon: Calendar, label: 'Leave Requests' },
        { to: '/admin/leave-types', icon: Calendar, label: 'Leave Types' },
        { to: '/admin/holidays', icon: Calendar, label: 'Holidays' },
        { to: '/admin/payroll', icon: CreditCard, label: 'Payroll Runs' },
        { to: '/admin/payslips', icon: CreditCard, label: 'Payslips' },
        { to: '/admin/expenses', icon: Package, label: 'Expense Claims' },
        { to: '/admin/assets', icon: Package, label: 'Asset Inventory' },

        { to: '/admin/recruitment/jobs', icon: Briefcase, label: 'Job Postings' },
        { to: '/admin/recruitment/candidates', icon: Users, label: 'Candidates' },

        { to: '/admin/performance-reviews', icon: TrendingUp, label: 'Performance Reviews' },

        { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
        { to: '/admin/roles', icon: Shield, label: 'Roles & Permissions' },

        { to: '/admin/approvals', icon: CheckCircle2, label: 'Approvals' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar
                items={sidebarItems}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            {/* Responsive margin: ml-0 on mobile, ml-64 on desktop */}
            <div className="flex-1 ml-0 md:ml-64 flex flex-col transition-all duration-300">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-4 md:p-8 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
