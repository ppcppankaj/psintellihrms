import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../shared/Sidebar';
import { Header } from '../shared/Header';
import { LayoutDashboard, Users, Settings, Building, CreditCard, FileText, Brain } from 'lucide-react';

const SuperAdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const sidebarItems = [
        { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/superadmin/organizations', icon: Building, label: 'Organizations' },
        { to: '/superadmin/users', icon: Users, label: 'Global Users' },
        { to: '/superadmin/plans', icon: CreditCard, label: 'Plans' },
        { to: '/superadmin/invoices', icon: FileText, label: 'Invoices' },
        { to: '/superadmin/ai-models', icon: Brain, label: 'AI Models' },
        { to: '/superadmin/system-settings', icon: Settings, label: 'System Settings' },
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

export default SuperAdminLayout;
