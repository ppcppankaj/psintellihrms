/**
 * Subscriptions Management Page - Admin can view and manage tenant subscriptions
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService, Subscription, Plan } from '@/services/billingService'
import { tenantsService, Tenant } from '@/services/tenantsService'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline'

export default function SubscriptionsPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
    const [form, setForm] = useState({
        tenant: '',
        plan: '',
        billing_cycle: 'monthly' as 'monthly' | 'yearly',
        start_date: '',
        end_date: '',
        status: 'active' as const
    })

    const { data: subscriptions, isLoading } = useQuery({
        queryKey: ['admin-subscriptions'],
        queryFn: billingService.getSubscriptions
    })

    const { data: plans } = useQuery({
        queryKey: ['admin-plans'],
        queryFn: billingService.getPlans
    })

    const { data: tenants } = useQuery({
        queryKey: ['admin-tenants'],
        queryFn: tenantsService.getTenants
    })

    const createMutation = useMutation({
        mutationFn: billingService.createSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
            setIsModalOpen(false)
            resetForm()
            toast.success('Subscription created successfully')
        },
        onError: () => toast.error('Failed to create subscription')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => billingService.updateSubscription(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
            setIsModalOpen(false)
            resetForm()
            toast.success('Subscription updated successfully')
        },
        onError: () => toast.error('Failed to update subscription')
    })

    const resetForm = () => {
        setEditingSubscription(null)
        setForm({
            tenant: '',
            plan: '',
            billing_cycle: 'monthly',
            start_date: '',
            end_date: '',
            status: 'active'
        })
    }

    const handleEdit = (subscription: Subscription) => {
        setEditingSubscription(subscription)
        setForm({
            tenant: subscription.tenant,
            plan: typeof subscription.plan === 'string' ? subscription.plan : subscription.plan_details?.id || '',
            billing_cycle: subscription.billing_cycle,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            status: (subscription.status as typeof form.status) || 'active'
        })
        setIsModalOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const selectedPlan = (plans as Plan[])?.find(p => p.id === form.plan)
        const price = form.billing_cycle === 'monthly' 
            ? selectedPlan?.price_monthly 
            : selectedPlan?.price_yearly

        // Default dates if user did not pick
        const today = new Date()
        const startDate = form.start_date || today.toISOString().slice(0, 10)
        const daysToAdd = form.billing_cycle === 'yearly' ? 365 : 30
        const endDate = form.end_date || new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

        const data = {
            ...form,
            start_date: startDate,
            end_date: endDate,
            price: price || 0
        }

        if (editingSubscription) {
            updateMutation.mutate({ id: editingSubscription.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    if (isLoading) return <LoadingSpinner />

    const subscriptionList = Array.isArray(subscriptions) ? subscriptions : []
    const planList = Array.isArray(plans) ? plans : []

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'trial': return 'bg-blue-100 text-blue-800'
            case 'past_due': return 'bg-amber-100 text-amber-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            case 'expired': return 'bg-gray-100 text-gray-800'
            default: return 'bg-surface-100 text-surface-800'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Tenant Subscriptions</h1>
                <button
                    onClick={() => {
                        resetForm()
                        setIsModalOpen(true)
                    }}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Subscription
                </button>
            </div>

            <Card>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                            <thead>
                                <tr>
                                    <th className="text-left text-xs font-medium text-surface-500 uppercase py-3 px-4">Tenant</th>
                                    <th className="text-left text-xs font-medium text-surface-500 uppercase py-3 px-4">Plan</th>
                                    <th className="text-left text-xs font-medium text-surface-500 uppercase py-3 px-4">Cycle</th>
                                    <th className="text-left text-xs font-medium text-surface-500 uppercase py-3 px-4">Price</th>
                                    <th className="text-left text-xs font-medium text-surface-500 uppercase py-3 px-4">Status</th>
                                    <th className="text-left text-xs font-medium text-surface-500 uppercase py-3 px-4">Start Date</th>
                                    <th className="text-left text-xs font-medium text-surface-500 uppercase py-3 px-4">End Date</th>
                                    <th className="text-left text-xs font-medium text-surface-500 uppercase py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                                {subscriptionList.length > 0 ? (
                                    subscriptionList.map((subscription) => (
                                        <tr key={subscription.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                            <td className="py-3 px-4 text-sm font-medium">{subscription.tenant}</td>
                                            <td className="py-3 px-4 text-sm">
                                                {subscription.plan_details?.name || subscription.plan}
                                            </td>
                                            <td className="py-3 px-4 text-sm capitalize">{subscription.billing_cycle}</td>
                                            <td className="py-3 px-4 text-sm">₹{subscription.price}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs rounded-full uppercase font-medium ${getStatusColor(subscription.status)}`}>
                                                    {subscription.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm">{subscription.start_date}</td>
                                            <td className="py-3 px-4 text-sm">{subscription.end_date}</td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleEdit(subscription)}
                                                    className="p-2 text-surface-500 hover:text-primary-600"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-surface-500">
                                            No subscriptions found. Create one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    resetForm()
                }}
                title={editingSubscription ? 'Edit Subscription' : 'Create Subscription'}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Tenant</label>
                        <select
                            value={form.tenant}
                            onChange={e => setForm({ ...form, tenant: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                            disabled={!!editingSubscription}
                        >
                            <option value="">Select Tenant</option>
                            {Array.isArray(tenants) && tenants.map(tenant => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Plan</label>
                        <select
                            value={form.plan}
                            onChange={e => setForm({ ...form, plan: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        >
                            <option value="">Select Plan</option>
                            {planList.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} - ₹{form.billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly}/{form.billing_cycle}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Billing Cycle</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="monthly"
                                    checked={form.billing_cycle === 'monthly'}
                                    onChange={e => setForm({ ...form, billing_cycle: e.target.value as 'monthly' })}
                                    className="mr-2"
                                />
                                <span className="text-sm">Monthly</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="yearly"
                                    checked={form.billing_cycle === 'yearly'}
                                    onChange={e => setForm({ ...form, billing_cycle: e.target.value as 'yearly' })}
                                    className="mr-2"
                                />
                                <span className="text-sm">Yearly</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Date</label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={e => setForm({ ...form, start_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">End Date</label>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={e => setForm({ ...form, end_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value as any })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="trial">Trial</option>
                            <option value="active">Active</option>
                            <option value="past_due">Past Due</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                        </select>
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
                                : editingSubscription ? 'Update Subscription' : 'Create Subscription'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
