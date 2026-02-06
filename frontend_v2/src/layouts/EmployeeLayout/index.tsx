import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../shared/Sidebar';
import { Header } from '../shared/Header';
import {
    LayoutDashboard,
    User,
    Clock,
    Calendar,
    FileText,
    ClipboardList
} from 'lucide-react';

const EmployeeLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const sidebarItems = [
        { to: '/employee', icon: LayoutDashboard, label: 'My Dashboard' },
        { to: '/employee/profile', icon: User, label: 'Profile' },
        { to: '/employee/attendance', icon: Clock, label: 'Attendance' },
        { to: '/employee/leaves', icon: Calendar, label: 'My Leaves' },
        { to: '/employee/payslips', icon: FileText, label: 'Payslips' },
        { to: '/employee/tasks', icon: ClipboardList, label: 'Tasks' },
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

export default EmployeeLayout;
