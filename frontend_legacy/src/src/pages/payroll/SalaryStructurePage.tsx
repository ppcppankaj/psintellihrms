
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { payrollService } from '../../services/payrollService'; // Ensure this path is correct
// If employeeService exists, import it to list employees for selection
import { employeeService } from '../../services/employeeService';

// Minimal UI Components (Input, Button, Modal, Card) - assuming these exist or using raw HTML/Tailwind for speed
// In a real app, import these from components/ui

const SalaryStructurePage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [calculatedBreakdown, setCalculatedBreakdown] = useState<any>(null);

    // Form
    const { register, handleSubmit, watch, reset } = useForm();
    const selectedCtc = watch('annual_ctc');

    // Fetch Employees for dropdown
    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeService.getEmployees(),
    });

    // Fetch Compensations List
    const { data: compensations, isLoading: isLoadingCompensations, error } = useQuery({
        queryKey: ['compensations'],
        queryFn: () => payrollService.getAllCompensations(),
    });

    console.log('Compensations Data:', compensations);
    console.log('Is Loading:', isLoadingCompensations);
    if (error) console.error('Compensations Error:', error);

    // Mutation to calculate structure
    const calculateMutation = useMutation({
        mutationFn: (ctc: number) => payrollService.calculateStructure(ctc),
        onSuccess: (data) => {
            setCalculatedBreakdown(data);
        }
    });

    // Mutation to save (Not fully implemented on backend yet, but this is the UI)
    // For now, we will just log it or show success
    const saveMutation = useMutation({
        mutationFn: (data: any) => {
            // Transform data to match backend serializer
            const payload = {
                employee: data.employee,
                effective_from: new Date().toISOString().split('T')[0], // Today
                annual_ctc: data.annual_ctc,
                components: data.breakdown.components.map((c: any) => ({
                    component_code: c.code,
                    monthly_amount: c.monthly,
                    annual_amount: c.annual
                }))
            };
            return payrollService.saveCompensation(payload);
        },
        onSuccess: () => {
            setIsModalOpen(false);
            reset();
            setCalculatedBreakdown(null);
            queryClient.invalidateQueries({ queryKey: ['compensations'] });
            // Show success message (using alert for now, toast system not in scope logic yet)
            alert('Salary Structure Saved Successfully!');
        },
        onError: (err: any) => {
            console.error(err);
            alert('Failed to save structure: ' + (err.response?.data?.message || err.message));
        }
    });

    const onCalculate = () => {
        const ctc = parseFloat(selectedCtc);
        if (ctc > 0) {
            calculateMutation.mutate(ctc);
        }
    };

    const onSubmit = (data: any) => {
        saveMutation.mutate({ ...data, breakdown: calculatedBreakdown });
    };

    // Handle paginated response structure if exists
    const employeeList = employees?.results || (Array.isArray(employees) ? employees : []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Salary Structures</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
                >
                    + Assign Structure
                </button>
            </div>

            {/* List would go here - omitted for brevity as backend endpoint for list all compensations isn't explicitly requested yet, focusing on Creation flow */}
            {/* Compensation List */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual CTC</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Gross</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingCompensations ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : compensations?.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No salary structures defined yet.</td></tr>
                        ) : (
                            compensations?.map((comp: any) => (
                                <tr key={comp.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {comp.employee_details?.full_name || 'Unknown'}
                                        </div>
                                        <div className="text-sm text-gray-500">{comp.employee_details?.employee_id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{comp.annual_ctc?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{comp.monthly_gross?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {comp.effective_from}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                // Pre-fill logic could go here
                                                alert('Edit feature coming soon!');
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between">
                            <h2 className="text-lg font-semibold">Assign Salary Structure</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Employee Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                <select {...register('employee')} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border">
                                    <option value="">Select Employee...</option>
                                    {employeeList.map((emp: any) => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</option>
                                    ))}
                                </select>
                            </div>

                            {/* CTC Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Annual CTC (₹)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        {...register('annual_ctc')}
                                        className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                        placeholder="e.g. 1200000"
                                    />
                                    <button
                                        type="button"
                                        onClick={onCalculate}
                                        disabled={calculateMutation.isPending}
                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border border-gray-300"
                                    >
                                        {calculateMutation.isPending ? 'Calculating...' : 'Calculate Breakdown'}
                                    </button>
                                </div>
                            </div>

                            {/* Breakdown Preview */}
                            {calculatedBreakdown && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Proposed Breakdown</h3>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                                                <th className="text-right text-xs font-medium text-gray-500 uppercase">Monthly</th>
                                                <th className="text-right text-xs font-medium text-gray-500 uppercase">Annual</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {calculatedBreakdown.components.map((c: any) => (
                                                <tr key={c.code}>
                                                    <td className="py-2 text-sm text-gray-900">{c.name}</td>
                                                    <td className="py-2 text-sm text-gray-900 text-right">{c.monthly.toLocaleString()}</td>
                                                    <td className="py-2 text-sm text-gray-900 text-right">{c.annual.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold border-t border-gray-300">
                                                <td className="py-2 text-sm text-gray-900">Total Fixed</td>
                                                <td className="py-2 text-sm text-gray-900 text-right">{calculatedBreakdown.monthly_ctc.toLocaleString()}</td>
                                                <td className="py-2 text-sm text-gray-900 text-right">{calculatedBreakdown.annual_ctc.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={!calculatedBreakdown}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Structure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryStructurePage;
