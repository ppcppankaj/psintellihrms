import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
        }
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </NavLink>
);

interface SidebarProps {
    items: SidebarItemProps[];
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, isOpen = false, onClose }) => (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                onClick={onClose}
            />
        )}

        {/* Sidebar */}
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 md:fixed md:inset-y-0
        `}>
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">PS Intelli - HR</h1>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Enterprise</p>
                </div>
                {/* Close button for mobile */}
                <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {items.map((item) => (
                    <SidebarItem key={item.to} {...item} />
                ))}
            </nav>
        </aside>
    </>
);
