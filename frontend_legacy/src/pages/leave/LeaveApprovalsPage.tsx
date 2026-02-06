/**
 * LeaveApprovalsPage - Manage pending leave requests
 */

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { leaveService, LeaveRequest } from '@/services/leaveService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'

export default function LeaveApprovalsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Leave Approvals
                </h1>
                <p className="text-surface-500 mt-1">
                    Review and action pending leave requests from your team
                </p>
            </div>

            <ApprovalsList />
        </div>
    )
}

function ApprovalsList() {
    const { user } = useAuthStore()
    const { data: requests, isLoading } = useQuery({
        queryKey: ['leave-approvals'],
        queryFn: () => leaveService.getPendingApprovals(),
        enabled: !!user?.employee_id,
    })

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!requests || requests.length === 0) {
        return (
            <Card className="p-12 text-center text-surface-500">
                <p>No pending approvals found.</p>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {requests.map((request) => (
                    <ApprovalCard key={request.id} request={request} />
                ))}
            </AnimatePresence>
        </div>
    )
}

function ApprovalCard({ request }: { request: LeaveRequest }) {
    const queryClient = useQueryClient()
    const [comments, setComments] = useState('')
    const [isActing, setIsActing] = useState(false)

    const approveMutation = useMutation({
        mutationFn: () => leaveService.approve(request.id, comments),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-approvals'] })
            toast.success('Leave approved')
        },
        onError: () => toast.error('Failed to approve'),
        onSettled: () => setIsActing(false)
    })

    const rejectMutation = useMutation({
        mutationFn: () => leaveService.reject(request.id, comments),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-approvals'] })
            toast.success('Leave rejected')
        },
        onError: () => toast.error('Failed to reject'),
        onSettled: () => setIsActing(false)
    })

    const handleAction = (action: 'approve' | 'reject') => {
        setIsActing(true)
        if (action === 'approve') approveMutation.mutate()
        else rejectMutation.mutate()
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card p-6 border-l-4"
            style={{ borderLeftColor: request.color }}
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-surface-900 dark:text-white">
                            {request.employee_name}
                        </span>
                        <span className="badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300">
                            {request.leave_type_name}
                        </span>
                    </div>

                    <div className="text-surface-600 dark:text-surface-400 space-y-1">
                        <p>
                            <span className="font-medium">Date:</span> {new Date(request.start_date).toLocaleDateString()} — {new Date(request.end_date).toLocaleDateString()}
                            <span className="ml-2 text-sm text-surface-500">({request.total_days} days)</span>
                        </p>
                        <p>
                            <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 min-w-[300px]">
                    <textarea
                        className="form-input text-sm"
                        placeholder="Add comments (optional)..."
                        rows={2}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => handleAction('reject')}
                            disabled={isActing}
                            className="btn bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 border-transparent"
                        >
                            {isActing ? <LoadingSpinner size="sm" /> : <><XMarkIcon className="w-4 h-4 mr-2" /> Reject</>}
                        </button>
                        <button
                            onClick={() => handleAction('approve')}
                            disabled={isActing}
                            className="btn bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 border-transparent"
                        >
                            {isActing ? <LoadingSpinner size="sm" /> : <><CheckIcon className="w-4 h-4 mr-2" /> Approve</>}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
