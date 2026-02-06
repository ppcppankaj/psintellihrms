import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { LogOut, Bell, MessageSquare, Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center space-x-4">
                <button
                    onClick={onMenuClick}
                    className="p-1 -ml-2 text-slate-500 hover:text-primary-600 md:hidden"
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-slate-500 text-sm font-medium hidden sm:block">Workspace: <span className="text-slate-900">PS Intelli - HR</span></h2>
            </div>

            <div className="flex items-center space-x-6">
                <button className="text-slate-500 hover:text-primary-600 relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <button
                    className="text-slate-500 hover:text-primary-600"
                    onClick={() => window.location.hash = '#/chat'}
                    title="Chat"
                >
                    <MessageSquare size={20} />
                </button>

                <div className="flex items-center space-x-3 border-l pl-6 border-slate-200">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{user?.full_name}</p>
                        <p className="text-xs text-slate-500">{user?.roles.join(', ')}</p>
                    </div>
                    <button
                        onClick={() => dispatch(logout())}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};
