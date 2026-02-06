import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState: React.FC<{ message?: string }> = ({ message = 'No data available' }) => (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Inbox size={48} strokeWidth={1.5} />
        <p className="mt-4 text-sm font-medium">{message}</p>
    </div>
);

export const Loader: React.FC = () => (
    <div className="flex items-center justify-center h-full w-full p-8">
        <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
    </div>
);
