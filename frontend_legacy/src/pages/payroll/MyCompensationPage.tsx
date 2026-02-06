
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { payrollService } from '../../services/payrollService';

const MyCompensationPage: React.FC = () => {
    const { data: compensation, isLoading, error } = useQuery({
        queryKey: ['myCompensation'],
        queryFn: () => payrollService.getMyCompensation(),
        retry: false
    });

    if (isLoading) {
        return <div className="p-6">Loading compensation details...</div>;
    }

    if (error || !compensation) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    Unable to load compensation details. You may not have an active salary structure assigned.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Compensation</h1>

            {/* Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Annual CTC</p>
                        <p className="text-3xl font-bold text-gray-900">
                            ₹{compensation.annual_ctc.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Monthly Gross</p>
                        <p className="text-3xl font-bold text-indigo-600">
                            ₹{compensation.monthly_gross.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Effective From</p>
                        <p className="text-xl font-medium text-gray-700">
                            {new Date(compensation.effective_from).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Salary Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly (₹)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Annual (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {compensation.components.map((comp) => (
                                <tr key={comp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {comp.component_name}
                                        <span className="text-xs text-gray-500 ml-2">({comp.component_code})</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                        {comp.monthly_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                        {comp.annual_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total Gross</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">
                                    {compensation.monthly_gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">
                                    {(compensation.monthly_gross * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyCompensationPage;
