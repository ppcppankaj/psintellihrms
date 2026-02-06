/**
 * Leave Page - Apply leave, view balance, requests
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    PlusIcon,
    XCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { leaveService, LeaveApplyData, LeaveBalance, LeaveRequest } from '@/services/leaveService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

import LeaveCalendar from './LeaveCalendar'
import { CalendarIcon, RectangleGroupIcon } from '@heroicons/react/24/outline'

export default function LeavePage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar'>('dashboard')
    const [showApplyModal, setShowApplyModal] = useState(false)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                        Leave Management
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mt-1">
                        Apply for leave and view your balance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex p-1 bg-surface-100 dark:bg-surface-800 rounded-lg">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'dashboard' ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500'}`}
                            title="Dashboard"
                        >
                            <RectangleGroupIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'calendar' ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500'}`}
                            title="Calendar"
                        >
                            <CalendarIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowApplyModal(true)}
                        className="btn-primary"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Apply Leave
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Leave Balance Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <LeaveBalanceGrid />
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Leave Requests */}
                        <div className="lg:col-span-2 card">
                            <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                    My Leave Requests
                                </h2>
                            </div>
                            <LeaveRequestsList />
                        </div>

                        {/* Upcoming Holidays */}
                        <div className="card">
                            <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                    Upcoming Holidays
                                </h2>
                            </div>
                            <UpcomingHolidays />
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <LeaveCalendar />
                </motion.div>
            )}

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <ApplyLeaveModal onClose={() => setShowApplyModal(false)} />
            )}
        </div>
    )
}

function LeaveBalanceGrid() {
    const { user } = useAuthStore()
    const { data: balances, isLoading } = useQuery({
        queryKey: ['leave-balance'],
        queryFn: () => leaveService.getMyBalance(),
        enabled: !!user?.employee_id,
    })

    if (isLoading) {
        return Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
                <div className="h-16 bg-surface-200 dark:bg-surface-700 rounded" />
            </div>
        ))
    }

    return balances?.map((balance) => (
        <LeaveBalanceCard key={balance.leave_type_id} balance={balance} />
    ))
}

function LeaveRequestsList() {
    const { user } = useAuthStore()
    const { data: requests, isLoading } = useQuery({
        queryKey: ['leave-requests'],
        queryFn: () => leaveService.getMyRequests(),
        enabled: !!user?.employee_id,
    })

    return (
        <div className="divide-y divide-surface-200 dark:divide-surface-700">
            {isLoading ? (
                <div className="p-8 text-center">
                    <LoadingSpinner />
                </div>
            ) : requests?.length === 0 ? (
                <div className="p-8 text-center text-surface-500">
                    No leave requests found
                </div>
            ) : (
                requests?.slice(0, 5).map((request) => (
                    <LeaveRequestRow key={request.id} request={request} />
                ))
            )}
        </div>
    )
}

function UpcomingHolidays() {
    const { data: holidays } = useQuery({
        queryKey: ['upcoming-holidays'],
        queryFn: () => leaveService.getUpcomingHolidays(5),
    })

    return (
        <div className="p-4 space-y-3">
            {holidays?.map((holiday) => (
                <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50"
                >
                    <div>
                        <p className="font-medium text-surface-900 dark:text-white">
                            {holiday.name}
                        </p>
                        <p className="text-sm text-surface-500">
                            {new Date(holiday.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    {holiday.is_optional && (
                        <span className="badge badge-info">Optional</span>
                    )}
                </div>
            ))}
        </div>
    )
}


function LeaveBalanceCard({ balance }: { balance: LeaveBalance }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-4 text-center"
        >
            <div
                className="w-3 h-3 rounded-full mx-auto mb-2"
                style={{ backgroundColor: balance.color }}
            />
            <p className="text-2xl font-bold text-surface-900 dark:text-white">
                {balance.available}
            </p>
            <p className="text-xs text-surface-500 truncate" title={balance.leave_type_name}>
                {balance.leave_type_code}
            </p>
        </motion.div>
    )
}

function LeaveRequestRow({ request }: { request: LeaveRequest }) {
    const queryClient = useQueryClient()

    const cancelMutation = useMutation({
        mutationFn: (id: string) => leaveService.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
            queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
            toast.success('Leave cancelled')
        },
        onError: () => {
            toast.error('Failed to cancel leave')
        },
    })

    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'Pending', className: 'badge-warning' },
        approved: { label: 'Approved', className: 'badge-success' },
        rejected: { label: 'Rejected', className: 'badge-error' },
        cancelled: { label: 'Cancelled', className: 'bg-surface-200 text-surface-600' },
    }

    const config = statusConfig[request.status] || statusConfig.pending

    return (
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
                <div
                    className="w-2 h-10 rounded-full mr-4"
                    style={{ backgroundColor: request.color }}
                />
                <div>
                    <p className="font-medium text-surface-900 dark:text-white">
                        {request.leave_type_name}
                    </p>
                    <p className="text-sm text-surface-500">
                        {new Date(request.start_date).toLocaleDateString()} —{' '}
                        {new Date(request.end_date).toLocaleDateString()}
                        {' · '}{request.total_days} day(s)
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <span className={`badge ${config.className}`}>{config.label}</span>
                {request.status === 'pending' && (
                    <button
                        onClick={() => cancelMutation.mutate(request.id)}
                        disabled={cancelMutation.isPending}
                        className="text-red-500 hover:text-red-700"
                    >
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    )
}

function ApplyLeaveModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient()
    const [calculation, setCalculation] = useState<{
        total_days: number
        leave_dates: string[]
    } | null>(null)

    const { data: leaveTypes } = useQuery({
        queryKey: ['leave-types'],
        queryFn: () => leaveService.getLeaveTypes(),
    })

    const { register, handleSubmit, watch, formState: { errors } } = useForm<LeaveApplyData>()

    const startDate = watch('start_date')
    const endDate = watch('end_date')
    const startDayType = watch('start_day_type') || 'full'
    const endDayType = watch('end_day_type') || 'full'

    // Calculate days when dates change
    const calculateMutation = useMutation({
        mutationFn: (data: { start_date: string; end_date: string; start_day_type: string; end_day_type: string }) =>
            leaveService.calculateDays(data),
        onSuccess: (data) => {
            setCalculation(data)
        },
    })

    const applyMutation = useMutation({
        mutationFn: (data: LeaveApplyData) => leaveService.apply(data),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
                queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
                toast.success(response.message)
                onClose()
            } else {
                toast.error(response.message)
            }
        },
        onError: (error: unknown) => {
            const axiosError = error as import('axios').AxiosError<{ message?: string }>
            toast.error(axiosError.response?.data?.message || 'Failed to apply leave')
        },
    })

    const handleCalculate = () => {
        if (startDate && endDate) {
            calculateMutation.mutate({
                start_date: startDate,
                end_date: endDate,
                start_day_type: startDayType,
                end_day_type: endDayType,
            })
        }
    }

    const onSubmit = (data: LeaveApplyData) => {
        applyMutation.mutate(data)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass-card p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        Apply for Leave
                    </h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Leave Type */}
                    <div>
                        <label className="form-label">Leave Type</label>
                        <select
                            className={`form-input ${errors.leave_type ? 'form-input-error' : ''}`}
                            {...register('leave_type', { required: 'Required' })}
                        >
                            <option value="">Select leave type</option>
                            {leaveTypes?.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                className={`form-input ${errors.start_date ? 'form-input-error' : ''}`}
                                {...register('start_date', { required: 'Required' })}
                                onBlur={handleCalculate}
                            />
                        </div>
                        <div>
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                className={`form-input ${errors.end_date ? 'form-input-error' : ''}`}
                                {...register('end_date', { required: 'Required' })}
                                onBlur={handleCalculate}
                            />
                        </div>
                    </div>

                    {/* Day Types */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Start Day</label>
                            <select className="form-input" {...register('start_day_type')}>
                                <option value="full">Full Day</option>
                                <option value="first_half">First Half</option>
                                <option value="second_half">Second Half</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">End Day</label>
                            <select className="form-input" {...register('end_day_type')}>
                                <option value="full">Full Day</option>
                                <option value="first_half">First Half</option>
                                <option value="second_half">Second Half</option>
                            </select>
                        </div>
                    </div>

                    {/* Calculation Result */}
                    {calculation && (
                        <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                            <div className="flex items-center justify-between">
                                <span className="text-primary-700 dark:text-primary-300">Total Days:</span>
                                <span className="text-xl font-bold text-primary-700 dark:text-primary-300">
                                    {calculation.total_days}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="form-label">Reason</label>
                        <textarea
                            rows={3}
                            className={`form-input ${errors.reason ? 'form-input-error' : ''}`}
                            placeholder="Enter reason for leave..."
                            {...register('reason', { required: 'Reason is required' })}
                        />
                        {errors.reason && (
                            <p className="mt-1 text-sm text-red-500">{errors.reason.message}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={applyMutation.isPending}
                            className="btn-primary"
                        >
                            {applyMutation.isPending ? <LoadingSpinner size="sm" /> : 'Submit'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
