import React from 'react';
import { Settings, Bell, Lock, ShieldCheck, Database } from 'lucide-react';

const SystemSettings: React.FC = () => {
    const sections = [
        {
            title: 'Global Branding',
            description: 'Application name, logos, and theme settings',
            icon: Settings,
        },
        {
            title: 'Audit Logs',
            description: 'View system-wide security and activity logs',
            icon: Database,
        },
        {
            title: 'Security & Auth',
            description: '2FA settings, session timeouts, and password policies',
            icon: Lock,
        },
        {
            title: 'Feature Flags',
            description: 'Enable or disable platform features globally',
            icon: ShieldCheck,
        },
        {
            title: 'Email Templates',
            description: 'Configure system notification emails',
            icon: Bell,
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
                <p className="text-slate-500">Configure global platform parameters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <button
                        key={section.title}
                        onClick={() => alert(`${section.title} is coming soon in the next update!`)}
                        className="flex flex-col items-start p-6 bg-white border border-slate-200 rounded-xl hover:border-primary-500 hover:shadow-md transition-all text-left group"
                    >
                        <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-primary-50 transition-colors mb-4">
                            <section.icon className="text-slate-600 group-hover:text-primary-600" size={24} />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">{section.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{section.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SystemSettings;
