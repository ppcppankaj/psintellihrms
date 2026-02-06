/**
 * Plans Management Page - Admin can create and manage subscription plans
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService, Plan } from '@/services/billingService'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'
import { PlusIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline'

export default function PlansPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
        price_monthly: '',
        price_yearly: '',
        max_employees: '',
        max_admins: '',
        is_trial: false,
        trial_days: '14',
        features: {
            payroll: false,
            recruitment: false,
            performance: false,
            attendance: false,
            leave: false,
            expenses: false,
            assets: false,
            onboarding: false,
            compliance: false,
            reports: false,
            integrations: false,
            ai_services: false
        }
    })

    const { data: plans, isLoading } = useQuery({
        queryKey: ['admin-plans'],
        queryFn: billingService.getPlans
    })

    const createMutation = useMutation({
        mutationFn: billingService.createPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
            setIsModalOpen(false)
            resetForm()
            toast.success('Plan created successfully')
        },
        onError: () => toast.error('Failed to create plan')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => billingService.updatePlan(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
            setIsModalOpen(false)
            resetForm()
            toast.success('Plan updated successfully')
        },
        onError: () => toast.error('Failed to update plan')
    })

    const resetForm = () => {
        setEditingPlan(null)
        setForm({
            name: '',
            code: '',
            description: '',
            price_monthly: '',
            price_yearly: '',
            max_employees: '',
            max_admins: '',
            is_trial: false,
            trial_days: '14',
            features: {
                payroll: false,
                recruitment: false,
                performance: false,
                attendance: false,
                leave: false,
                expenses: false,
                assets: false,
                onboarding: false,
                compliance: false,
                reports: false,
                integrations: false,
                ai_services: false
            }
        })
    }

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan)
        setForm({
            name: plan.name,
            code: plan.code,
            description: plan.description,
            price_monthly: plan.price_monthly.toString(),
            price_yearly: plan.price_yearly.toString(),
            max_employees: plan.max_employees?.toString() || '',
            max_admins: plan.max_admins?.toString() || '',
            is_trial: plan.is_trial,
            trial_days: plan.trial_days.toString(),
            features: {
                payroll: plan.features?.payroll || false,
                recruitment: plan.features?.recruitment || false,
                performance: plan.features?.performance || false,
                attendance: plan.features?.attendance || false,
                leave: plan.features?.leave || false,
                expenses: plan.features?.expenses || false,
                assets: plan.features?.assets || false,
                onboarding: plan.features?.onboarding || false,
                compliance: plan.features?.compliance || false,
                reports: plan.features?.reports || false,
                integrations: plan.features?.integrations || false,
                ai_services: plan.features?.ai_services || false
            }
        })
        setIsModalOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const data = {
            name: form.name,
            code: form.code,
            description: form.description,
            price_monthly: parseFloat(form.price_monthly),
            price_yearly: parseFloat(form.price_yearly),
            max_employees: form.max_employees ? parseInt(form.max_employees) : undefined,
            max_admins: form.max_admins ? parseInt(form.max_admins) : undefined,
            is_trial: form.is_trial,
            trial_days: parseInt(form.trial_days),
            features: form.features
        }

        if (editingPlan) {
            updateMutation.mutate({ id: editingPlan.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    if (isLoading) return <LoadingSpinner />

    const planList = Array.isArray(plans) ? plans : []

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Subscription Plans</h1>
                <button
                    onClick={() => {
                        resetForm()
                        setIsModalOpen(true)
                    }}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planList.length > 0 ? (
                    planList.map(plan => (
                    <Card key={plan.id}>
                        <CardHeader title={plan.name} />
                        <CardContent>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs text-surface-500 uppercase">Code</p>
                                    <p className="font-mono text-sm">{plan.code}</p>
                                </div>
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="p-2 text-surface-500 hover:text-primary-600"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {plan.description && (
                                    <p className="text-sm text-surface-600">{plan.description}</p>
                                )}

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm">Monthly</span>
                                        <span className="font-semibold">₹{plan.price_monthly}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">Yearly</span>
                                        <span className="font-semibold">₹{plan.price_yearly}</span>
                                    </div>
                                </div>

                                {(plan.max_employees || plan.max_admins) && (
                                    <div className="pt-2 border-t space-y-1">
                                        {plan.max_employees && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-surface-500">Max Employees</span>
                                                <span>{plan.max_employees}</span>
                                            </div>
                                        )}
                                        {plan.max_admins && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-surface-500">Max Admins</span>
                                                <span>{plan.max_admins}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {plan.is_trial && (
                                    <div className="pt-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {plan.trial_days} Day Trial
                                        </span>
                                    </div>
                                )}

                                <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-surface-500 uppercase mb-2">Features</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(plan.features).map(([feature, enabled]) => (
                                            enabled && (
                                                <div key={feature} className="flex items-center text-xs">
                                                    <CheckIcon className="w-4 h-4 text-green-500 mr-1" />
                                                    <span className="capitalize">{feature.replace('_', ' ')}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-surface-500 mb-4">No plans created yet.</p>
                        <button
                            onClick={() => {
                                resetForm()
                                setIsModalOpen(true)
                            }}
                            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Create First Plan
                        </button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    resetForm()
                }}
                title={editingPlan ? 'Edit Plan' : 'Create Plan'}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Plan Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Starter"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Plan Code</label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                                placeholder="STARTER"
                                required
                                disabled={!!editingPlan}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows={2}
                            placeholder="Perfect for small teams..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Monthly Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.price_monthly}
                                onChange={e => setForm({ ...form, price_monthly: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="999.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Yearly Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.price_yearly}
                                onChange={e => setForm({ ...form, price_yearly: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="9999.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Max Employees</label>
                            <input
                                type="number"
                                value={form.max_employees}
                                onChange={e => setForm({ ...form, max_employees: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Unlimited"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Max Admins</label>
                            <input
                                type="number"
                                value={form.max_admins}
                                onChange={e => setForm({ ...form, max_admins: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Unlimited"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={form.is_trial}
                                onChange={e => setForm({ ...form, is_trial: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-sm">Offer Trial Period</span>
                        </label>

                        {form.is_trial && (
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={form.trial_days}
                                    onChange={e => setForm({ ...form, trial_days: e.target.value })}
                                    className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    min="1"
                                />
                                <span className="ml-2 text-sm">days</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">Features</label>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(form.features).map(feature => (
                                <label key={feature} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={form.features[feature as keyof typeof form.features]}
                                        onChange={e => setForm({
                                            ...form,
                                            features: { ...form.features, [feature]: e.target.checked }
                                        })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false)
                                resetForm()
                            }}
                            className="px-4 py-2 border border-surface-300 rounded-lg hover:bg-surface-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : editingPlan ? 'Update Plan' : 'Create Plan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
