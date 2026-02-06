/**
 * Expense Admin Page - Manage categories and approve claims
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    PlusIcon,
    XMarkIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XCircleIcon,
    BanknotesIcon,
    TagIcon,
} from '@heroicons/react/24/outline'
import { expenseService, ExpenseCategory, ExpenseClaim } from '@/services/expenseService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ExpenseAdminPage() {
    const [activeTab, setActiveTab] = useState<'approvals' | 'categories' | 'all-claims'>('approvals')
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                        Expense Administration
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mt-1">
                        Manage categories and approve expense claims
                    </p>
                </div>
                {activeTab === 'categories' && (
                    <button
                        onClick={() => {
                            setEditingCategory(null)
                            setShowCategoryModal(true)
                        }}
                        className="btn-primary"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        New Category
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg w-fit">
                {[
                    { id: 'approvals', label: 'Pending Approvals' },
                    { id: 'categories', label: 'Categories' },
                    { id: 'all-claims', label: 'All Claims' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow'
                                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'approvals' && <PendingApprovalsTab />}
            {activeTab === 'categories' && (
                <CategoriesTab
                    onEdit={(c) => {
                        setEditingCategory(c)
                        setShowCategoryModal(true)
                    }}
                />
            )}
            {activeTab === 'all-claims' && <AllClaimsTab />}

            {/* Category Modal */}
            {showCategoryModal && (
                <CategoryModal
                    category={editingCategory}
                    onClose={() => {
                        setShowCategoryModal(false)
                        setEditingCategory(null)
                    }}
                />
            )}
        </div>
    )
}

function PendingApprovalsTab() {
    const queryClient = useQueryClient()

    const { data: pendingClaims, isLoading } = useQuery({
        queryKey: ['pending-expense-approvals'],
        queryFn: () => expenseService.getPendingApprovals(),
    })

    const approveMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
            expenseService.approveClaim(id, { action }),
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ['pending-expense-approvals'] })
            toast.success(action === 'approve' ? 'Claim approved' : 'Claim rejected')
        },
        onError: () => {
            toast.error('Action failed')
        },
    })

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <LoadingSpinner />
            </div>
        )
    }

    if (!pendingClaims || pendingClaims.length === 0) {
        return (
            <div className="card p-8 text-center">
                <BanknotesIcon className="w-12 h-12 mx-auto text-surface-400 mb-4" />
                <p className="text-surface-500">No pending approvals</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {pendingClaims.map((claim) => (
                <motion.div
                    key={claim.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mr-4">
                                <BanknotesIcon className="w-6 h-6 text-primary-500" />
                            </div>
                            <div>
                                <p className="font-medium text-surface-900 dark:text-white">
                                    {claim.title}
                                </p>
                                <p className="text-sm text-surface-500">
                                    {claim.employee_name} · {claim.claim_number} · {claim.item_count} items
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-xl font-bold text-surface-900 dark:text-white">
                                    ₹{claim.total_claimed_amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-surface-500">
                                    {new Date(claim.claim_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => approveMutation.mutate({ id: claim.id, action: 'approve' })}
                                    disabled={approveMutation.isPending}
                                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                    title="Approve"
                                >
                                    <CheckIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => approveMutation.mutate({ id: claim.id, action: 'reject' })}
                                    disabled={approveMutation.isPending}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    title="Reject"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

function CategoriesTab({ onEdit }: { onEdit: (category: ExpenseCategory) => void }) {
    const { data: categories, isLoading } = useQuery({
        queryKey: ['expense-categories-all'],
        queryFn: () => expenseService.getCategories(false),
    })

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="card">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-surface-50 dark:bg-surface-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Code</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Limit/Claim</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Monthly Limit</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Receipt Required</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-surface-600 dark:text-surface-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                        {categories?.map((cat) => (
                            <tr key={cat.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        <TagIcon className="w-5 h-5 text-surface-400 mr-3" />
                                        <p className="font-medium text-surface-900 dark:text-white">{cat.name}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{cat.code}</td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                                    {cat.max_limit_per_claim ? `₹${cat.max_limit_per_claim.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                                    {cat.max_monthly_limit ? `₹${cat.max_monthly_limit.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`badge ${cat.requires_receipt ? 'badge-info' : 'bg-surface-200 text-surface-600'}`}>
                                        {cat.requires_receipt ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`badge ${cat.is_active ? 'badge-success' : 'bg-surface-200 text-surface-600'}`}>
                                        {cat.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => onEdit(cat)}
                                            className="p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function AllClaimsTab() {
    const { data: claims, isLoading } = useQuery({
        queryKey: ['all-expense-claims'],
        queryFn: () => expenseService.getClaims(),
    })

    const statusColors: Record<string, string> = {
        draft: 'bg-surface-200 text-surface-600',
        submitted: 'badge-info',
        pending_approval: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-error',
        paid: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-surface-200 text-surface-600',
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="card">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-surface-50 dark:bg-surface-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Claim</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Employee</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Claimed</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Approved</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                        {claims?.map((claim) => (
                            <tr key={claim.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                <td className="px-4 py-3">
                                    <p className="font-medium text-surface-900 dark:text-white">{claim.title}</p>
                                    <p className="text-sm text-surface-500">{claim.claim_number}</p>
                                </td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                                    {claim.employee_name}
                                </td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                                    {new Date(claim.claim_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">
                                    ₹{claim.total_claimed_amount.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-green-600">
                                    ₹{claim.total_approved_amount.toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`badge ${statusColors[claim.status] || 'badge-info'}`}>
                                        {claim.status.replace('_', ' ')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

interface CategoryFormData {
    name: string
    code: string
    description: string
    max_limit_per_claim?: number
    max_monthly_limit?: number
    requires_receipt: boolean
    is_active: boolean
}

function CategoryModal({
    category,
    onClose,
}: {
    category: ExpenseCategory | null
    onClose: () => void
}) {
    const queryClient = useQueryClient()
    const isEdit = !!category

    const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormData>({
        defaultValues: category || {
            name: '',
            code: '',
            description: '',
            requires_receipt: true,
            is_active: true,
        },
    })

    const createMutation = useMutation({
        mutationFn: (data: Partial<ExpenseCategory>) => expenseService.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense-categories-all'] })
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
            toast.success('Category created')
            onClose()
        },
        onError: () => {
            toast.error('Failed to create category')
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: Partial<ExpenseCategory>) => expenseService.updateCategory(category!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense-categories-all'] })
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
            toast.success('Category updated')
            onClose()
        },
        onError: () => {
            toast.error('Failed to update category')
        },
    })

    const onSubmit = (data: CategoryFormData) => {
        if (isEdit) {
            updateMutation.mutate(data)
        } else {
            createMutation.mutate(data)
        }
    }

    const isPending = createMutation.isPending || updateMutation.isPending

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass-card p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        {isEdit ? 'Edit Category' : 'New Category'}
                    </h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                                {...register('name', { required: 'Required' })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Code</label>
                            <input
                                type="text"
                                className={`form-input ${errors.code ? 'form-input-error' : ''}`}
                                {...register('code', { required: 'Required' })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Max per Claim (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                {...register('max_limit_per_claim', { valueAsNumber: true })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="form-label">Monthly Limit (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                {...register('max_monthly_limit', { valueAsNumber: true })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="form-label">Description</label>
                            <textarea
                                rows={2}
                                className="form-input"
                                {...register('description')}
                            />
                        </div>
                    </div>

                    <div className="flex space-x-6">
                        <label className="flex items-center">
                            <input type="checkbox" className="form-checkbox" {...register('is_active')} />
                            <span className="ml-2">Active</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" className="form-checkbox" {...register('requires_receipt')} />
                            <span className="ml-2">Requires Receipt</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending} className="btn-primary">
                            {isPending ? <LoadingSpinner size="sm" /> : isEdit ? 'Save Changes' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
