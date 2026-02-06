/**
 * Employee Transitions Page - Transfers, Promotions, Resignations
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FieldError } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    ArrowsRightLeftIcon,
    ArrowTrendingUpIcon,
    ArrowRightOnRectangleIcon,
    XMarkIcon,
    CheckIcon,
    XCircleIcon,
    PlusIcon,
} from '@heroicons/react/24/outline'
import { transitionsService, CreateResignationData } from '@/services/transitionsService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

import { useSearchParams } from 'react-router-dom'

export default function TransitionsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = (searchParams.get('tab') as 'transfers' | 'promotions' | 'resignations') || 'transfers'

    const setActiveTab = (tab: string) => {
        setSearchParams({ tab })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Employee Transitions
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Manage transfers, promotions, and resignations
                </p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg w-fit">
                {[
                    { id: 'transfers', label: 'Transfers', icon: ArrowsRightLeftIcon },
                    { id: 'promotions', label: 'Promotions', icon: ArrowTrendingUpIcon },
                    { id: 'resignations', label: 'Resignations', icon: ArrowRightOnRectangleIcon },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow'
                            : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'transfers' && <TransfersTab />}
                {activeTab === 'promotions' && <PromotionsTab />}
                {activeTab === 'resignations' && <ResignationsTab />}
            </motion.div>
        </div>
    )
}

function TransfersTab() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [selectedTransfer, setSelectedTransfer] = useState<any>(null)

    const { data: transfers = [], isLoading } = useQuery({
        queryKey: ['employee-transfers'],
        queryFn: () => transitionsService.getTransfers(),
    })

    const approveMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
            transitionsService.approveTransfer(id, { action }),
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ['employee-transfers'] })
            toast.success(action === 'approve' ? 'Transfer approved' : 'Transfer rejected')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => transitionsService.deleteTransfer?.(id) || Promise.reject('Delete not available'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-transfers'] })
            toast.success('Transfer deleted')
        },
        onError: () => {
            toast.error('Cannot delete transfer. It may have been processed or approved.')
        }
    })

    const statusColors: Record<string, string> = {
        draft: 'bg-surface-200 text-surface-600',
        pending: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-error',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-surface-200 text-surface-600',
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => {
                        setSelectedTransfer(null)
                        setShowModal(true)
                    }}
                    className="btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Transfer
                </button>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Employee</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Type</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Change</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Effective</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Status</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-surface-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {transfers?.map((transfer) => (
                                <tr key={transfer.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-surface-900 dark:text-white">{transfer.employee_name}</p>
                                        <p className="text-sm text-surface-500">{transfer.employee_id}</p>
                                    </td>
                                    <td className="px-4 py-3 text-surface-600">{transfer.transfer_type_display}</td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-surface-600">
                                            {transfer.from_department_name && `${transfer.from_department_name} → ${transfer.to_department_name}`}
                                            {transfer.from_location_name && `${transfer.from_location_name} → ${transfer.to_location_name}`}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-surface-600">
                                        {new Date(transfer.effective_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge ${statusColors[transfer.status]}`}>
                                            {transfer.status_display}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end space-x-2">
                                            {transfer.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => approveMutation.mutate({ id: transfer.id, action: 'approve' })}
                                                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                                                        title="Approve"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => approveMutation.mutate({ id: transfer.id, action: 'reject' })}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                        title="Reject"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {['draft', 'pending'].includes(transfer.status) && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTransfer(transfer)
                                                            setShowModal(true)
                                                        }}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg text-xs"
                                                        title="Edit"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this transfer?')) {
                                                                deleteMutation.mutate(transfer.id)
                                                            }
                                                        }}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                        title="Delete"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <TransferModal
                    transfer={selectedTransfer}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        queryClient.invalidateQueries({ queryKey: ['employee-transfers'] })
                        setShowModal(false)
                    }}
                />
            )}
        </>
    )
}

function TransferModal({ transfer, onClose, onSave }: { transfer?: any; onClose: () => void; onSave: () => void }) {
    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        defaultValues: transfer || { transfer_type: 'department' }
    })

    const transferType = watch('transfer_type')

    const { data: employees = [] } = useQuery({
        queryKey: ['employees-list'],
        queryFn: async () => {
            const response = await import('@/services/api').then(m => m.api.get('/employees/'))
            const data = response.data
            if (Array.isArray(data)) return data
            if (data?.results) return data.results
            if (data?.data) return data.data
            return []
        }
    })

    const { data: departments = [] } = useQuery({
        queryKey: ['departments-list'],
        queryFn: async () => {
            const response = await import('@/services/api').then(m => m.api.get('/employees/departments/'))
            const data = response.data
            if (Array.isArray(data)) return data
            if (data?.results) return data.results
            if (data?.data) return data.data
            return []
        }
    })

    const { data: locations = [] } = useQuery({
        queryKey: ['locations-list'],
        queryFn: async () => {
            const response = await import('@/services/api').then(m => m.api.get('/employees/locations/'))
            const data = response.data
            if (Array.isArray(data)) return data
            if (data?.results) return data.results
            if (data?.data) return data.data
            return []
        }
    })

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (transfer?.id) {
                return transitionsService.updateTransfer?.(transfer.id, data) || Promise.reject('Update not available')
            }
            return transitionsService.createTransfer(data)
        },
        onSuccess: () => {
            toast.success(transfer ? 'Transfer updated' : 'Transfer created')
            onSave()
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to save transfer')
        }
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{transfer ? 'Edit Transfer' : 'New Transfer'}</h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Employee *</label>
                        <select {...register('employee_id', { required: 'Required' })} className="form-input">
                            <option value="">Select employee</option>
                            {employees.map((emp: any) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.full_name || `${emp.user?.first_name} ${emp.user?.last_name}`} ({emp.employee_id})
                                </option>
                            ))}
                        </select>
                        {errors.employee_id && <p className="text-red-500 text-xs mt-1">{(errors.employee_id as FieldError)?.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Transfer Type *</label>
                        <select {...register('transfer_type', { required: 'Required' })} className="form-input">
                            <option value="department">Department Transfer</option>
                            <option value="location">Location Transfer</option>
                            <option value="manager">Manager Change</option>
                            <option value="combined">Combined Transfer</option>
                        </select>
                        {errors.transfer_type && <p className="text-red-500 text-xs mt-1">{(errors.transfer_type as FieldError)?.message}</p>}
                    </div>

                    {['department', 'combined'].includes(transferType) && (
                        <div>
                            <label className="block text-sm font-medium mb-1">To Department</label>
                            <select {...register('to_department_id')} className="form-input">
                                <option value="">Select department</option>
                                {departments.map((dept: any) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {['location', 'combined'].includes(transferType) && (
                        <div>
                            <label className="block text-sm font-medium mb-1">To Location</label>
                            <select {...register('to_location_id')} className="form-input">
                                <option value="">Select location</option>
                                {locations.map((loc: any) => (
                                    <option key={loc.id} value={loc.id}>{loc.name}, {loc.city}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Effective Date *</label>
                        <input type="date" {...register('effective_date', { required: 'Required' })} className="form-input" />
                        {errors.effective_date && <p className="text-red-500 text-xs mt-1">{(errors.effective_date as FieldError)?.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <textarea {...register('reason')} rows={2} className="form-input" />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1">
                            {saveMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


function PromotionsTab() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [selectedPromotion, setSelectedPromotion] = useState<any>(null)

    const { data: promotions = [], isLoading } = useQuery({
        queryKey: ['employee-promotions'],
        queryFn: () => transitionsService.getPromotions(),
    })

    const approveMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
            transitionsService.approvePromotion(id, { action }),
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ['employee-promotions'] })
            toast.success(action === 'approve' ? 'Promotion approved' : 'Promotion rejected')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => transitionsService.deletePromotion?.(id) || Promise.reject('Delete not available'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-promotions'] })
            toast.success('Promotion deleted')
        },
        onError: () => {
            toast.error('Cannot delete promotion. It may have been processed or approved.')
        }
    })

    const statusColors: Record<string, string> = {
        draft: 'bg-surface-200 text-surface-600',
        pending: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-error',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-surface-200 text-surface-600',
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => {
                        setSelectedPromotion(null)
                        setShowModal(true)
                    }}
                    className="btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Promotion
                </button>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Employee</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Designation Change</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Increment</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Effective</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Status</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-surface-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {promotions?.map((promo) => (
                                <tr key={promo.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-surface-900 dark:text-white">{promo.employee_name}</p>
                                        <p className="text-sm text-surface-500">{promo.employee_id}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-surface-600">
                                            {promo.from_designation_name} → {promo.to_designation_name}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {promo.increment_percentage && (
                                            <span className="text-green-600 font-medium">+{promo.increment_percentage}%</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-surface-600">
                                        {new Date(promo.effective_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge ${statusColors[promo.status]}`}>
                                            {promo.status_display}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end space-x-2">
                                            {promo.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => approveMutation.mutate({ id: promo.id, action: 'approve' })}
                                                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                                                        title="Approve"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => approveMutation.mutate({ id: promo.id, action: 'reject' })}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                        title="Reject"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {['draft', 'pending'].includes(promo.status) && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPromotion(promo)
                                                            setShowModal(true)
                                                        }}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg text-xs"
                                                        title="Edit"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this promotion?')) {
                                                                deleteMutation.mutate(promo.id)
                                                            }
                                                        }}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                        title="Delete"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <PromotionModal
                    promotion={selectedPromotion}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        queryClient.invalidateQueries({ queryKey: ['employee-promotions'] })
                        setShowModal(false)
                    }}
                />
            )}
        </>
    )
}

function PromotionModal({ promotion, onClose, onSave }: { promotion?: any; onClose: () => void; onSave: () => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: promotion || {}
    })

    const { data: employees = [] } = useQuery({
        queryKey: ['employees-list'],
        queryFn: async () => {
            const response = await import('@/services/api').then(m => m.api.get('/employees/'))
            const data = response.data
            if (Array.isArray(data)) return data
            if (data?.results) return data.results
            if (data?.data) return data.data
            return []
        }
    })

    const { data: designations = [] } = useQuery({
        queryKey: ['designations-list'],
        queryFn: async () => {
            const response = await import('@/services/api').then(m => m.api.get('/employees/designations/'))
            const data = response.data
            if (Array.isArray(data)) return data
            if (data?.results) return data.results
            if (data?.data) return data.data
            return []
        }
    })

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (promotion?.id) {
                return transitionsService.updatePromotion?.(promotion.id, data) || Promise.reject('Update not available')
            }
            return transitionsService.createPromotion(data)
        },
        onSuccess: () => {
            toast.success(promotion ? 'Promotion updated' : 'Promotion created')
            onSave()
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to save promotion')
        }
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{promotion ? 'Edit Promotion' : 'New Promotion'}</h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Employee *</label>
                        <select {...register('employee_id', { required: 'Required' })} className="form-input">
                            <option value="">Select employee</option>
                            {employees.map((emp: any) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.full_name || `${emp.user?.first_name} ${emp.user?.last_name}`} ({emp.employee_id})
                                </option>
                            ))}
                        </select>
                        {errors.employee_id && <p className="text-red-500 text-xs mt-1">{(errors.employee_id as FieldError)?.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">To Designation *</label>
                        <select {...register('to_designation_id', { required: 'Required' })} className="form-input">
                            <option value="">Select designation</option>
                            {designations.map((des: any) => (
                                <option key={des.id} value={des.id}>{des.name}</option>
                            ))}
                        </select>
                        {errors.to_designation_id && <p className="text-red-500 text-xs mt-1">{(errors.to_designation_id as FieldError)?.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Increment % *</label>
                            <input type="number" step="0.01" {...register('increment_percentage', { required: 'Required' })} className="form-input" />
                            {errors.increment_percentage && <p className="text-red-500 text-xs mt-1">{(errors.increment_percentage as FieldError)?.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">New CTC</label>
                            <input type="number" step="0.01" {...register('new_ctc')} className="form-input" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Effective Date *</label>
                        <input type="date" {...register('effective_date', { required: 'Required' })} className="form-input" />
                        {errors.effective_date && <p className="text-red-500 text-xs mt-1">{(errors.effective_date as FieldError)?.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <textarea {...register('reason')} rows={2} className="form-input" />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1">
                            {saveMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


function ResignationsTab() {
    const queryClient = useQueryClient()
    const [showResignModal, setShowResignModal] = useState(false)
    const [showExitModal, setShowExitModal] = useState(false)
    const [selectedResignation, setSelectedResignation] = useState<string | null>(null)

    const { data: resignations = [], isLoading } = useQuery({
        queryKey: ['employee-resignations'],
        queryFn: () => transitionsService.getResignations(),
    })

    const acceptMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) =>
            transitionsService.acceptResignation(id, { action }),
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ['employee-resignations'] })
            toast.success(action === 'accept' ? 'Resignation accepted' : 'Resignation rejected')
        },
    })

    const statusColors: Record<string, string> = {
        draft: 'bg-surface-200 text-surface-600',
        submitted: 'badge-info',
        accepted: 'badge-success',
        rejected: 'badge-error',
        withdrawn: 'bg-surface-200 text-surface-600',
        completed: 'bg-green-100 text-green-700',
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowResignModal(true)} className="btn-primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Submit Resignation
                </button>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Employee</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Reason</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Last Working Day</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Notice Period</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Status</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-surface-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {resignations?.map((resign) => (
                                <tr key={resign.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-surface-900 dark:text-white">{resign.employee_name}</p>
                                        <p className="text-sm text-surface-500">{resign.employee_id}</p>
                                    </td>
                                    <td className="px-4 py-3 text-surface-600">{resign.primary_reason_display}</td>
                                    <td className="px-4 py-3 text-surface-600">
                                        {new Date(resign.approved_last_working_date || resign.requested_last_working_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-surface-600">
                                        {resign.notice_period_days} days
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge ${statusColors[resign.status]}`}>
                                            {resign.status_display}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end space-x-2">
                                            {resign.status === 'submitted' && (
                                                <>
                                                    <button
                                                        onClick={() => acceptMutation.mutate({ id: resign.id, action: 'accept' })}
                                                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                                                        title="Accept"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => acceptMutation.mutate({ id: resign.id, action: 'reject' })}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                        title="Reject"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {['accepted', 'completed'].includes(resign.status) && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedResignation(resign.id)
                                                        setShowExitModal(true)
                                                    }}
                                                    className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg"
                                                    title="Exit Interview"
                                                >
                                                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showResignModal && <ResignationModal onClose={() => setShowResignModal(false)} />}
            {showExitModal && selectedResignation && (
                <ExitInterviewModal
                    resignationId={selectedResignation}
                    onClose={() => {
                        setShowExitModal(false)
                        setSelectedResignation(null)
                    }}
                />
            )}
        </>
    )
}

function ResignationModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient()
    const today = new Date().toISOString().split('T')[0]

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            resignation_date: today,
            requested_last_working_date: '',
            primary_reason: '',
            detailed_reason: '',
            new_employer: '',
        },
    })

    const resignationDate = watch('resignation_date')

    const createMutation = useMutation({
        mutationFn: transitionsService.createResignation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-resignations'] })
            toast.success('Resignation submitted')
            onClose()
        },
        onError: () => {
            toast.error('Failed to submit resignation')
        },
    })

    const onSubmit = (data: CreateResignationData) => {
        createMutation.mutate(data)
    }

    const reasonOptions = [
        { value: 'better_opportunity', label: 'Better Opportunity' },
        { value: 'personal', label: 'Personal Reasons' },
        { value: 'relocation', label: 'Relocation' },
        { value: 'health', label: 'Health Issues' },
        { value: 'higher_studies', label: 'Higher Studies' },
        { value: 'career_change', label: 'Career Change' },
        { value: 'compensation', label: 'Compensation' },
        { value: 'work_culture', label: 'Work Culture' },
        { value: 'other', label: 'Other' },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass-card p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        Submit Resignation
                    </h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Resignation Date</label>
                            <input
                                type="date"
                                className="form-input"
                                {...register('resignation_date', { required: true })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Last Working Date</label>
                            <input
                                type="date"
                                className={`form-input ${errors.requested_last_working_date ? 'form-input-error' : ''}`}
                                {...register('requested_last_working_date', {
                                    required: 'Last working date is required',
                                    validate: value => !resignationDate || value >= resignationDate || 'Last working date cannot be before resignation date'
                                })}
                            />
                            {errors.requested_last_working_date && (
                                <p className="mt-1 text-xs text-red-500">{(errors.requested_last_working_date as FieldError)?.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Reason</label>
                        <select className="form-input" {...register('primary_reason', { required: true })}>
                            <option value="">Select reason</option>
                            {reasonOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Details (Optional)</label>
                        <textarea
                            rows={3}
                            className="form-input"
                            placeholder="Additional details..."
                            {...register('detailed_reason')}
                        />
                    </div>

                    <div>
                        <label className="form-label">New Employer (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Company name"
                            {...register('new_employer')}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                            {createMutation.isPending ? <LoadingSpinner size="sm" /> : 'Submit'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

function ExitInterviewModal({ resignationId, onClose }: { resignationId: string; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            interview_date: new Date().toISOString().split('T')[0],
            job_satisfaction: 3,
            work_life_balance: 3,
            management_support: 3,
            growth_opportunities: 3,
            compensation_satisfaction: 3,
            work_environment: 3,
            team_collaboration: 3,
            reason_for_leaving: '',
            liked_most: '',
            improvements_suggested: '',
            would_recommend: true,
            would_return: true,
        },
    })

    const onSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            await transitionsService.submitExitInterview(resignationId, data)
            toast.success('Exit interview recorded')
            queryClient.invalidateQueries({ queryKey: ['employee-resignations'] })
            onClose()
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to record exit interview')
        } finally {
            setIsSubmitting(false)
        }
    }

    const ratingFields = [
        { name: 'job_satisfaction', label: 'Job Satisfaction' },
        { name: 'work_life_balance', label: 'Work-Life Balance' },
        { name: 'management_support', label: 'Management Support' },
        { name: 'growth_opportunities', label: 'Growth Opportunities' },
        { name: 'compensation_satisfaction', label: 'Compensation' },
        { name: 'work_environment', label: 'Work Environment' },
        { name: 'team_collaboration', label: 'Team Collaboration' },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-xl shadow-xl p-6 overflow-y-auto max-h-[90vh]"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        Record Exit Interview
                    </h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="form-label text-sm font-medium">Interview Date</label>
                            <input
                                type="date"
                                className="form-input mt-1"
                                {...register('interview_date', { required: true })}
                            />
                        </div>

                        <div className="col-span-2">
                            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3 border-b pb-1">Feedback Ratings (1-5)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {ratingFields.map(field => (
                                    <div key={field.name} className="flex flex-col">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-medium text-surface-700 dark:text-surface-300">{field.label}</label>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="1"
                                            className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                            {...register(field.name as any, { valueAsNumber: true })}
                                        />
                                        <div className="flex justify-between text-[10px] text-surface-400 mt-1 px-1">
                                            <span>Poor</span>
                                            <span>Average</span>
                                            <span>Excellent</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="form-label text-sm font-medium">Primary Reason for Leaving</label>
                            <textarea
                                className={`form-input mt-1 h-20 ${errors.reason_for_leaving ? 'border-red-500' : ''}`}
                                {...register('reason_for_leaving', { required: 'This field is required' })}
                                placeholder="Details about why you are leaving..."
                            />
                            {errors.reason_for_leaving && <p className="text-red-500 text-xs mt-1">{(errors.reason_for_leaving as FieldError)?.message}</p>}
                        </div>

                        <div className="col-span-1">
                            <label className="form-label text-sm font-medium">What did you like most?</label>
                            <textarea
                                className="form-input mt-1 h-20"
                                {...register('liked_most')}
                                placeholder="Company culture, benefits, etc."
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="form-label text-sm font-medium">Suggested Improvements</label>
                            <textarea
                                className="form-input mt-1 h-20"
                                {...register('improvements_suggested')}
                                placeholder="Things we could do better..."
                            />
                        </div>

                        <div className="col-span-1 flex items-center space-x-3 pt-2">
                            <input
                                type="checkbox"
                                id="would_recommend"
                                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                {...register('would_recommend')}
                            />
                            <label htmlFor="would_recommend" className="text-sm text-surface-700 dark:text-surface-300">
                                Would recommend this company
                            </label>
                        </div>

                        <div className="col-span-1 flex items-center space-x-3 pt-2">
                            <input
                                type="checkbox"
                                id="would_return"
                                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                {...register('would_return')}
                            />
                            <label htmlFor="would_return" className="text-sm text-surface-700 dark:text-surface-300">
                                Would consider returning
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-surface-200 dark:border-surface-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors border border-surface-300 dark:border-surface-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary"
                        >
                            {isSubmitting ? 'Recording...' : 'Record Interview'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
