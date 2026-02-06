/**
 * Expense Claims Page - Submit and manage expense claims
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    PlusIcon,
    XMarkIcon,
    BanknotesIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    EyeIcon,
    PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import { expenseService, ExpenseClaim, CreateExpenseClaimData, ExpenseCategory } from '@/services/expenseService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOrganizationContextReady } from '@/hooks/useAppReady'

export default function ExpensePage() {
    const isTenantReady = useOrganizationContextReady()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null)

    // Get expense categories (only for tenant users)
    const { data: categories } = useQuery({
        queryKey: ['expense-categories'],
        queryFn: () => expenseService.getCategories(),
        enabled: isTenantReady,
    })

    // Get my claims (only for tenant users)
    const { data: myClaims, isLoading } = useQuery({
        queryKey: ['my-expense-claims'],
        queryFn: () => expenseService.getMyClaims(),
        enabled: isTenantReady,
    })

    // Get expense summary (only for tenant users)
    const { data: summary } = useQuery({
        queryKey: ['expense-summary'],
        queryFn: () => expenseService.getExpenseSummary(),
        enabled: isTenantReady,
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                        Expense Claims
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mt-1">
                        Submit and track your expense reimbursements
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Claim
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard
                    icon={DocumentTextIcon}
                    label="Total Claims"
                    value={summary?.claim_count || 0}
                    color="blue"
                />
                <SummaryCard
                    icon={BanknotesIcon}
                    label="Total Claimed"
                    value={`₹${(summary?.total_claimed || 0).toLocaleString()}`}
                    color="purple"
                />
                <SummaryCard
                    icon={CheckCircleIcon}
                    label="Approved"
                    value={`₹${(summary?.total_approved || 0).toLocaleString()}`}
                    color="green"
                />
                <SummaryCard
                    icon={BanknotesIcon}
                    label="Paid"
                    value={`₹${(summary?.total_paid || 0).toLocaleString()}`}
                    color="emerald"
                />
            </div>

            {/* Claims List */}
            <div className="card">
                <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                        My Claims
                    </h2>
                </div>
                <div className="divide-y divide-surface-200 dark:divide-surface-700">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <LoadingSpinner />
                        </div>
                    ) : myClaims?.length === 0 ? (
                        <div className="p-8 text-center text-surface-500">
                            No expense claims found. Create your first claim!
                        </div>
                    ) : (
                        myClaims?.map((claim) => (
                            <ClaimRow
                                key={claim.id}
                                claim={claim}
                                onClick={() => setSelectedClaim(claim)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && categories && (
                <CreateClaimModal
                    categories={categories}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Detail Modal */}
            {selectedClaim && (
                <ClaimDetailModal
                    claim={selectedClaim}
                    onClose={() => setSelectedClaim(null)}
                />
            )}
        </div>
    )
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType
    label: string
    value: string | number
    color: 'blue' | 'purple' | 'green' | 'emerald'
}) {
    const colorClasses = {
        blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
        purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
        green: 'text-green-500 bg-green-50 dark:bg-green-900/20',
        emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-4"
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
            <p className="text-sm text-surface-500">{label}</p>
        </motion.div>
    )
}

function ClaimRow({ claim, onClick }: { claim: ExpenseClaim; onClick: () => void }) {
    const queryClient = useQueryClient()

    const submitMutation = useMutation({
        mutationFn: () => expenseService.submitClaim(claim.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-expense-claims'] })
            toast.success('Claim submitted for approval')
        },
        onError: () => {
            toast.error('Failed to submit claim')
        },
    })

    const statusConfig: Record<string, { label: string; className: string }> = {
        draft: { label: 'Draft', className: 'bg-surface-200 text-surface-600' },
        submitted: { label: 'Submitted', className: 'badge-info' },
        pending_approval: { label: 'Pending', className: 'badge-warning' },
        approved: { label: 'Approved', className: 'badge-success' },
        rejected: { label: 'Rejected', className: 'badge-error' },
        paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700' },
        cancelled: { label: 'Cancelled', className: 'bg-surface-200 text-surface-600' },
    }

    const config = statusConfig[claim.status] || statusConfig.draft

    return (
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mr-4">
                    <DocumentTextIcon className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                    <p className="font-medium text-surface-900 dark:text-white">
                        {claim.title}
                    </p>
                    <p className="text-sm text-surface-500">
                        {claim.claim_number} · {new Date(claim.claim_date).toLocaleDateString()} · {claim.item_count} items
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-semibold text-surface-900 dark:text-white">
                        ₹{claim.total_claimed_amount.toLocaleString()}
                    </p>
                    <span className={`badge ${config.className}`}>{config.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                    {claim.status === 'draft' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                submitMutation.mutate()
                            }}
                            disabled={submitMutation.isPending}
                            className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                            title="Submit"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={onClick}
                        className="p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                        title="View"
                    >
                        <EyeIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

interface CreateClaimForm {
    title: string
    description: string
    claim_date: string
    expense_from: string
    expense_to: string
    items: {
        category: string
        expense_date: string
        description: string
        claimed_amount: number
        vendor_name?: string
        receipt_number?: string
    }[]
}

function CreateClaimModal({
    categories,
    onClose,
}: {
    categories: ExpenseCategory[]
    onClose: () => void
}) {
    const queryClient = useQueryClient()
    const today = new Date().toISOString().split('T')[0]

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<CreateClaimForm>({
        defaultValues: {
            claim_date: today,
            expense_from: today,
            expense_to: today,
            items: [{ category: '', expense_date: today, description: '', claimed_amount: 0 }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    })

    const items = watch('items')
    const totalAmount = items?.reduce((sum, item) => sum + (Number(item.claimed_amount) || 0), 0) || 0

    const createMutation = useMutation({
        mutationFn: (data: CreateExpenseClaimData) => expenseService.createClaim(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-expense-claims'] })
            toast.success('Expense claim created')
            onClose()
        },
        onError: () => {
            toast.error('Failed to create claim')
        },
    })

    const onSubmit = (data: CreateClaimForm) => {
        createMutation.mutate({
            title: data.title,
            description: data.description,
            claim_date: data.claim_date,
            expense_from: data.expense_from,
            expense_to: data.expense_to,
            items: data.items.map(item => ({
                category: item.category,
                expense_date: item.expense_date,
                description: item.description,
                claimed_amount: Number(item.claimed_amount),
                vendor_name: item.vendor_name,
                receipt_number: item.receipt_number,
            })),
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl glass-card p-6 my-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        New Expense Claim
                    </h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Claim Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="form-label">Title</label>
                            <input
                                type="text"
                                className={`form-input ${errors.title ? 'form-input-error' : ''}`}
                                placeholder="e.g., Client Meeting Expenses"
                                {...register('title', { required: 'Title is required' })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Expense From</label>
                            <input
                                type="date"
                                className="form-input"
                                {...register('expense_from', { required: true })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Expense To</label>
                            <input
                                type="date"
                                className="form-input"
                                {...register('expense_to', { required: true })}
                            />
                        </div>
                    </div>

                    {/* Expense Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="form-label mb-0">Expense Items</label>
                            <button
                                type="button"
                                onClick={() => append({ category: '', expense_date: today, description: '', claimed_amount: 0 })}
                                className="text-sm text-primary-500 hover:text-primary-600"
                            >
                                <PlusIcon className="w-4 h-4 inline mr-1" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="text-xs text-surface-500">Category</label>
                                            <select
                                                className="form-input text-sm"
                                                {...register(`items.${index}.category`, { required: true })}
                                            >
                                                <option value="">Select</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-surface-500">Date</label>
                                            <input
                                                type="date"
                                                className="form-input text-sm"
                                                {...register(`items.${index}.expense_date`, { required: true })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs text-surface-500">Description</label>
                                            <input
                                                type="text"
                                                className="form-input text-sm"
                                                placeholder="Description"
                                                {...register(`items.${index}.description`, { required: true })}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                className={`form-input text-sm ${errors.items?.[index]?.claimed_amount ? 'form-input-error' : ''}`}
                                                placeholder="0"
                                                {...register(`items.${index}.claimed_amount`, { required: 'Amount required', min: { value: 1, message: 'Min 1' } })}
                                            />
                                            {errors.items?.[index]?.claimed_amount && (
                                                <span className="text-[10px] text-red-500">{errors.items[index]?.claimed_amount?.message}</span>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-surface-500">Vendor</label>
                                            <input
                                                type="text"
                                                className="form-input text-sm"
                                                placeholder="Optional"
                                                {...register(`items.${index}.vendor_name`)}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            {fields.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-between">
                        <span className="font-medium text-primary-700 dark:text-primary-300">Total Amount</span>
                        <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                            ₹{totalAmount.toLocaleString()}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="btn-primary"
                        >
                            {createMutation.isPending ? <LoadingSpinner size="sm" /> : 'Create Claim'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

function ClaimDetailModal({ claim, onClose }: { claim: ExpenseClaim; onClose: () => void }) {
    const queryClient = useQueryClient()

    // Fetch full claim details
    const { data: fullClaim } = useQuery({
        queryKey: ['expense-claim', claim.id],
        queryFn: () => expenseService.getClaim(claim.id),
    })

    const cancelMutation = useMutation({
        mutationFn: () => expenseService.cancelClaim(claim.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-expense-claims'] })
            toast.success('Claim cancelled')
            onClose()
        },
        onError: () => {
            toast.error('Failed to cancel claim')
        },
    })

    const claimData = fullClaim || claim

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl glass-card p-6 my-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                            {claimData.title}
                        </h2>
                        <p className="text-sm text-surface-500">{claimData.claim_number}</p>
                    </div>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Claim Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-sm text-surface-500">Period</p>
                        <p className="font-medium text-surface-900 dark:text-white">
                            {new Date(claimData.expense_from).toLocaleDateString()} - {new Date(claimData.expense_to).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-surface-500">Status</p>
                        <p className="font-medium text-surface-900 dark:text-white capitalize">
                            {claimData.status.replace('_', ' ')}
                        </p>
                    </div>
                </div>

                {/* Items */}
                {claimData.items && claimData.items.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-surface-500 mb-3">Expense Items</h3>
                        <div className="space-y-2">
                            {claimData.items.map((item) => (
                                <div key={item.id || Math.random().toString()} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                                    <div>
                                        <p className="font-medium text-surface-900 dark:text-white">
                                            {item.description}
                                        </p>
                                        <p className="text-sm text-surface-500">
                                            {item.category_name} · {new Date(item.expense_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-surface-900 dark:text-white">
                                        ₹{item.claimed_amount.toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Totals */}
                <div className="p-4 rounded-lg bg-surface-100 dark:bg-surface-800 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-surface-600">Claimed</span>
                        <span className="font-medium">₹{claimData.total_claimed_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-surface-600">Approved</span>
                        <span className="font-medium text-green-600">₹{claimData.total_approved_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-surface-200 dark:border-surface-700 pt-2">
                        <span className="font-medium">Paid</span>
                        <span className="font-bold text-primary-600">₹{claimData.total_paid_amount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="btn-secondary">
                        Close
                    </button>
                    {claimData.status === 'draft' && (
                        <button
                            onClick={() => cancelMutation.mutate()}
                            disabled={cancelMutation.isPending}
                            className="btn-error"
                        >
                            {cancelMutation.isPending ? <LoadingSpinner size="sm" /> : 'Cancel Claim'}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
