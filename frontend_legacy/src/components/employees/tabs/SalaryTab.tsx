
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { payrollService } from '@/services/payrollService';

interface SalaryTabProps {
    employeeId: string;
}

const SalaryTab: React.FC<SalaryTabProps> = ({ employeeId }) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    // Initial state matching the requested manual fields
    const defaultComponents = [
        // Earnings
        { component_name: 'Basic', component_code: 'BASIC', monthly_amount: 0, annual_amount: 0, type: 'earning' },
        { component_name: 'HRA', component_code: 'HRA', monthly_amount: 0, annual_amount: 0, type: 'earning' },
        { component_name: 'Special Allowance', component_code: 'SPECIAL', monthly_amount: 0, annual_amount: 0, type: 'earning' },
        { component_name: 'Conveyance', component_code: 'CONVEYANCE', monthly_amount: 0, annual_amount: 0, type: 'earning' },
        { component_name: 'Medical', component_code: 'MEDICAL', monthly_amount: 0, annual_amount: 0, type: 'earning' },
        { component_name: 'LTA', component_code: 'LTA', monthly_amount: 0, annual_amount: 0, type: 'earning' },
        { component_name: 'Performance Bonus', component_code: 'BONUS', monthly_amount: 0, annual_amount: 0, type: 'earning' },

        // Deductions
        { component_name: 'PF (Employee)', component_code: 'PF_EMPLOYEE', monthly_amount: 0, annual_amount: 0, type: 'deduction' },
        { component_name: 'ESI (Employee)', component_code: 'ESI_EMPLOYEE', monthly_amount: 0, annual_amount: 0, type: 'deduction' },
        { component_name: 'Professional Tax', component_code: 'PROF_TAX', monthly_amount: 0, annual_amount: 0, type: 'deduction' },

        // Employer Statutory
        { component_name: 'PF (Employer)', component_code: 'PF_EMPLOYER', monthly_amount: 0, annual_amount: 0, type: 'statutory' },
        { component_name: 'ESI (Employer)', component_code: 'ESI_EMPLOYER', monthly_amount: 0, annual_amount: 0, type: 'statutory' },
        { component_name: 'Gratuity', component_code: 'GRATUITY', monthly_amount: 0, annual_amount: 0, type: 'statutory' },
    ];

    const { register, control, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            annual_ctc: 0,
            monthly_gross: 0,
            components: defaultComponents
        }
    } as any);

    const { fields } = useFieldArray({
        control,
        name: 'components'
    });

    // Fetch existing compensation
    const { data: compensation } = useQuery({
        queryKey: ['compensation', employeeId],
        queryFn: async () => {
            const result = await payrollService.getCompensationByEmployee(employeeId);

            // If result exists, merge it with defaultComponents to preserve structure even if backend incomplete
            if (result && result.components) {
                const mergedComponents = defaultComponents.map(def => {
                    // Match by code (case-insensitive and handle various formats if needed)
                    const existing = result.components.find((c: any) =>
                        c.component_code?.toUpperCase() === def.component_code?.toUpperCase() ||
                        c.component?.code?.toUpperCase() === def.component_code?.toUpperCase()
                    );

                    return {
                        ...def,
                        ...existing,
                        // Ensure amounts are numbers
                        monthly_amount: Number(existing?.monthly_amount || 0),
                        annual_amount: Number(existing?.annual_amount || 0)
                    };
                });

                return { ...result, components: mergedComponents };
            }
            return null;
        }
    });

    // Update form when data loads
    useEffect(() => {
        if (compensation) {
            reset({
                annual_ctc: compensation.annual_ctc,
                monthly_gross: compensation.monthly_gross,
                components: compensation.components
            });
        }
    }, [compensation, reset]);


    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: ({ id, data }: { id?: string; data: any }) => {
            if (id) {
                return payrollService.updateCompensation(id, data);
            }
            return payrollService.saveCompensation(data);
        },
        onSuccess: () => {
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['compensation', employeeId] });
            toast.success('Salary structure saved successfully');
        },
        onError: (error) => {
            console.error('Failed to save salary structure:', error);
            toast.error('Failed to save salary structure. Please try again.');
        }
    });

    // Auto-calculate Totals
    const components = watch('components');

    // Derived totals
    const totals = React.useMemo(() => {
        let monthlyGross = 0;
        let monthlyDeductions = 0;
        let monthlyStatutory = 0;

        // console.log('Calculating totals...', components); // Debug

        components.forEach((c: any) => {
            const amount = parseFloat(c.monthly_amount) || 0;
            if (c.type === 'earning') {
                monthlyGross += amount;
            } else if (c.type === 'deduction') {
                monthlyDeductions += amount;
            } else if (c.type === 'statutory') {
                monthlyStatutory += amount;
            }
        });

        const monthlyCTC = monthlyGross + monthlyStatutory;
        const monthlyTakeHome = monthlyGross - monthlyDeductions;

        return {
            monthlyGross,
            annualGross: monthlyGross * 12,
            monthlyCTC,
            annualCTC: monthlyCTC * 12,
            monthlyTakeHome,
            annualTakeHome: monthlyTakeHome * 12,
            monthlyDeductions
        };
    }, [components]);

    const onSubmit = (data: any) => {
        const payload = {
            employee: employeeId,
            annual_ctc: totals.annualCTC,
            monthly_gross: totals.monthlyGross,
            is_current: true,
            effective_from: new Date().toISOString().split('T')[0],
            components: data.components.map((c: any) => ({
                component: c.component || null, // Send SalaryComponent ID (FK), not the row ID (c.id)
                component_name: c.component_name,
                // Use _input suffix to match backend serializer write-only fields
                component_code_input: c.component_code,
                component_type_input: c.type,
                monthly_amount: parseFloat(c.monthly_amount) || 0,
                annual_amount: (parseFloat(c.monthly_amount) || 0) * 12
            }))
        };
        console.log('Saving Payload:', payload);

        // Check if we are updating existing compensation or creating new
        const existingId = compensation?.id;
        saveMutation.mutate({ id: existingId, data: payload });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Salary Structure</h3>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                        {compensation ? 'Edit Structure' : 'Assign Structure'}
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                if (compensation) {
                                    reset(compensation); // Revert
                                }
                            }}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={saveMutation.isPending}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <p className="text-sm text-indigo-600 font-medium mb-1">Total CTC</p>
                        <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-bold text-indigo-900">₹{totals.annualCTC.toLocaleString()}</span>
                            <span className="text-sm text-indigo-700">/yr</span>
                        </div>
                        <div className="text-xs text-indigo-500 mt-1">₹{totals.monthlyCTC.toLocaleString()} /mo</div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                        <p className="text-sm text-emerald-600 font-medium mb-1">Gross Salary</p>
                        <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-bold text-emerald-900">₹{totals.annualGross.toLocaleString()}</span>
                            <span className="text-sm text-emerald-700">/yr</span>
                        </div>
                        <div className="text-xs text-emerald-500 mt-1">₹{totals.monthlyGross.toLocaleString()} /mo</div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-600 font-medium mb-1">Take Home (Net)</p>
                        <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-bold text-blue-900">₹{totals.annualTakeHome.toLocaleString()}</span>
                            <span className="text-sm text-blue-700">/yr</span>
                        </div>
                        <div className="text-xs text-blue-500 mt-1">₹{totals.monthlyTakeHome.toLocaleString()} /mo</div>
                    </div>
                </div>

                <form className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Earnings */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Earnings</h4>
                            <div className="space-y-3">
                                {fields.map((field: any, index) => {
                                    if (field.type !== 'earning') return null;
                                    const monthlyVal = (components && components[index]?.monthly_amount) || 0;
                                    return (
                                        <div key={field.id} className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-4 text-sm font-medium text-gray-700">
                                                {field.component_name}
                                                {field.component_code === 'BASIC' && <span className="text-red-500">*</span>}
                                            </div>
                                            <div className="col-span-4">
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">₹</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        disabled={!isEditing}
                                                        {...register(`components.${index}.monthly_amount`)}
                                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50"
                                                        placeholder="Monthly"
                                                    />
                                                    <input type="hidden" {...register(`components.${index}.component_code`)} />
                                                    <input type="hidden" {...register(`components.${index}.type`)} />
                                                    <input type="hidden" {...register(`components.${index}.component_name`)} />
                                                    <input type="hidden" {...register(`components.${index}.component`)} />
                                                </div>
                                            </div>
                                            <div className="col-span-4 text-sm text-gray-500 text-right">
                                                Annual: ₹{(monthlyVal * 12).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Deductions */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Deductions</h4>
                            <div className="space-y-3">
                                {fields.map((field: any, index) => {
                                    if (field.type !== 'deduction') return null;
                                    const monthlyVal = (components && components[index]?.monthly_amount) || 0;
                                    return (
                                        <div key={field.id} className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-4 text-sm font-medium text-gray-700">
                                                {field.component_name}
                                            </div>
                                            <div className="col-span-4">
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">₹</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        disabled={!isEditing}
                                                        {...register(`components.${index}.monthly_amount`)}
                                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50"
                                                        placeholder="Monthly"
                                                    />
                                                    <input type="hidden" {...register(`components.${index}.component_code`)} />
                                                    <input type="hidden" {...register(`components.${index}.type`)} />
                                                    <input type="hidden" {...register(`components.${index}.component_name`)} />
                                                    <input type="hidden" {...register(`components.${index}.component`)} />
                                                </div>
                                            </div>
                                            <div className="col-span-4 text-sm text-gray-500 text-right">
                                                Annual: ₹{(monthlyVal * 12).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Statutory */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Employer Contributions (Part of CTC)</h4>
                            <div className="space-y-3">
                                {fields.map((field: any, index) => {
                                    if (field.type !== 'statutory') return null;
                                    const monthlyVal = (components && components[index]?.monthly_amount) || 0;
                                    return (
                                        <div key={field.id} className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-4 text-sm font-medium text-gray-700">
                                                {field.component_name}
                                            </div>
                                            <div className="col-span-4">
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">₹</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        disabled={!isEditing}
                                                        {...register(`components.${index}.monthly_amount`)}
                                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md disabled:bg-gray-50"
                                                        placeholder="Monthly"
                                                    />
                                                    <input type="hidden" {...register(`components.${index}.component_code`)} />
                                                    <input type="hidden" {...register(`components.${index}.type`)} />
                                                    <input type="hidden" {...register(`components.${index}.component_name`)} />
                                                    <input type="hidden" {...register(`components.${index}.component`)} />
                                                </div>
                                            </div>
                                            <div className="col-span-4 text-sm text-gray-500 text-right">
                                                Annual: ₹{(monthlyVal * 12).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalaryTab;
