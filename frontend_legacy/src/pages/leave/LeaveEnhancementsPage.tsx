/**
 * Leave Enhancements Page - Encashment & Comp-Off Management
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    BanknotesIcon,
    CalendarDaysIcon,
    PlusIcon,
    XMarkIcon,
    CheckIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline'
import { leaveEnhancementsService, LeaveEncashment, CompensatoryLeave, CreateEncashmentData, CreateCompOffData } from '@/services/leaveEnhancementsService'
import { leaveService } from '@/services/leaveService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function LeaveEnhancementsPage() {
    const [activeTab, setActiveTab] = useState<'encashment' | 'compoff'>('encashment')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Leave Enhancements
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Encash leaves or claim compensatory off
                </p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg w-fit">
                {[
                    { id: 'encashment', label: 'Leave Encashment', icon: BanknotesIcon },
                    { id: 'compoff', label: 'Compensatory Off', icon: CalendarDaysIcon },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
            {activeTab === 'encashment' && <EncashmentTab />}
            {activeTab === 'compoff' && <CompOffTab />}
        </div>
    )
}

function EncashmentTab() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)

    const { data: encashments, isLoading } = useQuery({
        queryKey: ['my-encashments'],
        queryFn: () => leaveEnhancementsService.getMyEncashments(),
        enabled: !!user?.employee_id,
    })

    const statusColors: Record<string, string> = {
        draft: 'bg-surface-200 text-surface-600',
        pending: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-error',
        paid: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-surface-200 text-surface-600',
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Request Encashment
                </button>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Leave Type</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Year</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Days</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Amount</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {encashments?.map((enc) => (
                                <tr key={enc.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">
                                        {enc.leave_type_name}
                                    </td>
                                    <td className="px-4 py-3 text-surface-600">{enc.year}</td>
                                    <td className="px-4 py-3 text-surface-600">
                                        {enc.days_approved || enc.days_requested}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-surface-900">
                                        {enc.total_amount ? `₹${enc.total_amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge ${statusColors[enc.status]}`}>
                                            {enc.status_display}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-surface-600">
                                        {new Date(enc.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {(!encashments || encashments.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-surface-500">
                                        No encashment requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && <EncashmentModal onClose={() => setShowModal(false)} />}
        </>
    )
}

function EncashmentModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient()
    const currentYear = new Date().getFullYear()

    const { data: leaveTypes } = useQuery({
        queryKey: ['leave-types'],
        queryFn: () => leaveService.getLeaveTypes(),
    })

    const { register, handleSubmit, formState: { errors } } = useForm<CreateEncashmentData>({
        defaultValues: {
            year: currentYear,
            days_requested: 0,
        },
    })

    const createMutation = useMutation({
        mutationFn: leaveEnhancementsService.createEncashment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-encashments'] })
            toast.success('Encashment request created')
            onClose()
        },
        onError: () => {
            toast.error('Failed to create encashment request')
        },
    })

    const onSubmit = (data: CreateEncashmentData) => {
        createMutation.mutate(data)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-card p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        Request Leave Encashment
                    </h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="form-label">Leave Type</label>
                        <select className="form-input" {...register('leave_type_id', { required: true })}>
                            <option value="">Select leave type</option>
                            {leaveTypes?.filter(lt => lt.is_paid).map((lt) => (
                                <option key={lt.id} value={lt.id}>{lt.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Year</label>
                            <select className="form-input" {...register('year', { valueAsNumber: true })}>
                                <option value={currentYear}>{currentYear}</option>
                                <option value={currentYear - 1}>{currentYear - 1}</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Days to Encash</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                className="form-input"
                                {...register('days_requested', { required: true, valueAsNumber: true, min: 0.5 })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                            {createMutation.isPending ? <LoadingSpinner size="sm" /> : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

function CompOffTab() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)

    const { data: compOffs, isLoading } = useQuery({
        queryKey: ['my-compoffs'],
        queryFn: () => leaveEnhancementsService.getMyCompOffs(),
        enabled: !!user?.employee_id,
    })

    const statusColors: Record<string, string> = {
        pending: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-error',
        used: 'bg-blue-100 text-blue-700',
        expired: 'bg-surface-200 text-surface-600',
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Request Comp-Off
                </button>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-50 dark:bg-surface-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Work Date</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Type</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Reason</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Days</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Expires</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-surface-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {compOffs?.map((co) => (
                                <tr key={co.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">
                                        {new Date(co.work_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-surface-600">{co.work_type_display}</td>
                                    <td className="px-4 py-3 text-surface-600 max-w-xs truncate">{co.reason}</td>
                                    <td className="px-4 py-3 text-surface-600">{co.days_credited}</td>
                                    <td className="px-4 py-3 text-surface-600">
                                        {co.expiry_date ? new Date(co.expiry_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge ${statusColors[co.status]}`}>
                                            {co.status_display}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!compOffs || compOffs.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-surface-500">
                                        No compensatory off requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && <CompOffModal onClose={() => setShowModal(false)} />}
        </>
    )
}

function CompOffModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient()

    const { register, handleSubmit } = useForm<CreateCompOffData>({
        defaultValues: {
            work_date: new Date().toISOString().split('T')[0],
            work_type: 'holiday',
            reason: '',
            days_credited: 1,
        },
    })

    const createMutation = useMutation({
        mutationFn: leaveEnhancementsService.createCompOff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-compoffs'] })
            toast.success('Comp-off request created')
            onClose()
        },
        onError: () => {
            toast.error('Failed to create comp-off request')
        },
    })

    const onSubmit = (data: CreateCompOffData) => {
        createMutation.mutate(data)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-card p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        Request Compensatory Off
                    </h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Work Date</label>
                            <input type="date" className="form-input" {...register('work_date', { required: true })} />
                        </div>
                        <div>
                            <label className="form-label">Work Type</label>
                            <select className="form-input" {...register('work_type', { required: true })}>
                                <option value="holiday">Worked on Holiday</option>
                                <option value="weekend">Worked on Weekend</option>
                                <option value="extra_hours">Extra Hours</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Reason</label>
                        <textarea
                            rows={2}
                            className="form-input"
                            placeholder="Reason for working..."
                            {...register('reason', { required: true })}
                        />
                    </div>

                    <div>
                        <label className="form-label">Days to Credit</label>
                        <select className="form-input" {...register('days_credited', { valueAsNumber: true })}>
                            <option value={0.5}>Half Day (0.5)</option>
                            <option value={1}>Full Day (1)</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                            {createMutation.isPending ? <LoadingSpinner size="sm" /> : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
