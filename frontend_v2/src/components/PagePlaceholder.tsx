import React from 'react';
import { Construction } from 'lucide-react';

interface PagePlaceholderProps {
    title: string;
    description?: string;
}

export const PagePlaceholder: React.FC<PagePlaceholderProps> = ({ title, description }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                <Construction className="text-primary-600" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{title}</h1>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
                {description || "This section is currently under construction as we synchronize it with the high-performance API layer. Our team is working to bring you a premium experience."}
            </p>
            <div className="flex space-x-4">
                <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                    Development in Progress
                </div>
                <div className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                    Coming Soon
                </div>
            </div>
        </div>
    );
};
