/**
 * Leave Policies Page - Admin management of leave policies
 */

import { useState } from 'react'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { leaveService, LeavePolicy } from '@/services/leaveService'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'

export default function LeavePoliciesPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null)

    // Fetch policies
    const { data: policies = [], isLoading } = useQuery({
        queryKey: ['leave-policies'],
        queryFn: leaveService.getPolicies,
        select: (data: any) => Array.isArray(data) ? data : (data.results || [])
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: leaveService.createPolicy,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-policies'] })
            toast.success('Policy created successfully')
            handleCloseModal()
        },
        onError: () => toast.error('Failed to create policy')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LeavePolicy> }) =>
            leaveService.updatePolicy(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-policies'] })
            toast.success('Policy updated successfully')
            handleCloseModal()
        },
        onError: () => toast.error('Failed to update policy')
    })

    const deleteMutation = useMutation({
        mutationFn: leaveService.deletePolicy,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-policies'] })
            toast.success('Policy deleted successfully')
        },
        onError: () => toast.error('Failed to delete policy')
    })

    // Handlers
    const handleCreate = () => {
        setEditingPolicy(null)
        setIsModalOpen(true)
    }

    const handleEdit = (policy: LeavePolicy) => {
        setEditingPolicy(policy)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this policy?')) {
            deleteMutation.mutate(id)
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingPolicy(null)
    }



    // ... inside component

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Leave Policies</h1>
                    <p className="mt-1 text-sm text-surface-500">Manage leave rules and accrual policies</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Policy
                </button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                        <thead className="bg-surface-50 dark:bg-surface-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Policy Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Features</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Neg. Balance</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-surface-500">Loading...</td>
                                </tr>
                            ) : policies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-surface-500">No policies found.</td>
                                </tr>
                            ) : (
                                policies.map((policy: LeavePolicy) => (
                                    <tr key={policy.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-surface-900 dark:text-white">{policy.name}</div>
                                            <div className="text-xs text-surface-500 truncate max-w-xs">{policy.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {policy.sandwich_rule && <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">Sandwich</span>}
                                                {policy.probation_leave_allowed && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Probation</span>}
                                                {policy.count_weekends && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">Wknds</span>}
                                                {policy.count_holidays && <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-800 rounded">Holidays</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-900 dark:text-white">
                                            {policy.negative_balance_allowed ? (
                                                <span className="text-red-600 font-medium">Allows {policy.max_negative_balance} days</span>
                                            ) : (
                                                <span className="text-surface-400">Not Allowed</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${policy.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-300'
                                                }`}>
                                                {policy.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(policy)}
                                                    className="p-1 text-surface-400 hover:text-primary-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(policy.id)}
                                                    className="p-1 text-surface-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingPolicy ? 'Edit Policy' : 'Create New Policy'}
                size="lg"
            >
                <PolicyForm
                    initialData={editingPolicy}
                    onSubmit={(data) => {
                        if (editingPolicy) {
                            updateMutation.mutate({ id: editingPolicy.id, data })
                        } else {
                            createMutation.mutate(data)
                        }
                    }}
                    isSubmitting={createMutation.isPending || updateMutation.isPending}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    )
}

function PolicyForm({ initialData, onSubmit, isSubmitting, onCancel }: {
    initialData: LeavePolicy | null
    onSubmit: (data: Partial<LeavePolicy>) => void
    isSubmitting: boolean
    onCancel: () => void
}) {
    const [formData, setFormData] = useState<Partial<LeavePolicy>>(initialData || {
        name: '',
        description: '',
        sandwich_rule: false,
        probation_leave_allowed: false,
        negative_balance_allowed: false,
        max_negative_balance: 0,
        count_holidays: false,
        count_weekends: false,
        is_active: true
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Policy Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g. Standard Leave Policy"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Policy details..."
                        />
                    </div>
                </div>

                <div className="border-t border-surface-200 dark:border-surface-700 my-4" />

                {/* Rules Grid */}
                <div>
                    <h3 className="text-sm font-medium text-surface-900 dark:text-white mb-3">Leave Rules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Checkbox
                            label="Sandwich Rule"
                            name="sandwich_rule"
                            checked={!!formData.sandwich_rule}
                            onChange={handleChange}
                            description="Count intervening weekends/holidays as leave"
                        />
                        <Checkbox
                            label="Allow in Probation"
                            name="probation_leave_allowed"
                            checked={!!formData.probation_leave_allowed}
                            onChange={handleChange}
                            description="Employees in probation can take leave"
                        />
                        <Checkbox
                            label="Count Holidays"
                            name="count_holidays"
                            checked={!!formData.count_holidays}
                            onChange={handleChange}
                            description="Public holidays falling in leave period are counted"
                        />
                        <Checkbox
                            label="Count Weekends"
                            name="count_weekends"
                            checked={!!formData.count_weekends}
                            onChange={handleChange}
                            description="Weekends falling in leave period are counted"
                        />
                    </div>
                </div>

                <div className="border-t border-surface-200 dark:border-surface-700 my-4" />

                {/* Negative Balance */}
                <div>
                    <h3 className="text-sm font-medium text-surface-900 dark:text-white mb-3">Balance Settings</h3>
                    <div className="space-y-4">
                        <Checkbox
                            label="Allow Negative Balance"
                            name="negative_balance_allowed"
                            checked={!!formData.negative_balance_allowed}
                            onChange={handleChange}
                        />

                        {formData.negative_balance_allowed && (
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Max Negative Days
                                </label>
                                <input
                                    type="number"
                                    name="max_negative_balance"
                                    value={formData.max_negative_balance}
                                    onChange={handleChange}
                                    className="w-full md:w-1/2 px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <Checkbox
                        label="Active"
                        name="is_active"
                        checked={!!formData.is_active}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Saving...' : 'Save Policy'}
                </button>
            </div>
        </form>
    )
}

function Checkbox({ label, name, checked, onChange, description }: {
    label: string
    name: string
    checked: boolean
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    description?: string
}) {
    return (
        <div className="flex items-start">
            <div className="flex items-center h-5">
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={onChange}
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
            </div>
            <div className="ml-3 text-sm">
                <label className="font-medium text-surface-700 dark:text-surface-300">{label}</label>
                {description && <p className="text-surface-500">{description}</p>}
            </div>
        </div>
    )
}
