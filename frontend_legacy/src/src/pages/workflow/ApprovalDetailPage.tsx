/**
 * ApprovalDetailPage - View and action single approval
 */

import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useWorkflowStore } from '@/store/workflowStore'
import WorkflowTimeline from '@/components/workflow/WorkflowTimeline'
import ApprovalActionModal from '@/components/workflow/ApprovalActionModal'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const statusBadge: Record<string, { variant: 'default' | 'success' | 'warning' | 'error'; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    in_progress: { variant: 'default', label: 'In Progress' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'error', label: 'Rejected' },
    cancelled: { variant: 'default', label: 'Cancelled' },
}

export default function ApprovalDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const {
        currentApproval,
        isLoadingDetail,
        fetchApprovalDetail,
        takeAction,
        clearCurrentApproval
    } = useWorkflowStore()

    const [modalState, setModalState] = useState<{
        isOpen: boolean
        action: 'approve' | 'reject'
    }>({ isOpen: false, action: 'approve' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (id) {
            fetchApprovalDetail(id)
        }
        return () => clearCurrentApproval()
    }, [id, fetchApprovalDetail, clearCurrentApproval])

    const handleConfirm = async (comments: string) => {
        if (!id) return
        setIsSubmitting(true)
        try {
            await takeAction(id, { action: modalState.action, comments })
            setModalState({ ...modalState, isOpen: false })
            navigate('/workflows/approvals')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoadingDetail) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!currentApproval) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
                    Request not found
                </h2>
                <Link to="/workflows/approvals" className="inline-block mt-4 text-primary-600 hover:text-primary-700">
                    ← Back to Approvals
                </Link>
            </div>
        )
    }

    const isPending = currentApproval.status === 'pending' || currentApproval.status === 'in_progress'

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-surface-500">
                <Link to="/workflows/approvals" className="hover:text-primary-600">Approvals</Link>
                <span>/</span>
                <span className="text-surface-900 dark:text-white">{currentApproval.title}</span>
            </nav>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                            {currentApproval.title}
                        </h1>
                        <Badge variant={statusBadge[currentApproval.status]?.variant || 'default'}>
                            {statusBadge[currentApproval.status]?.label || currentApproval.status}
                        </Badge>
                        {currentApproval.is_overdue && (
                            <Badge variant="error" dot>Overdue</Badge>
                        )}
                    </div>
                    <p className="text-surface-500 mt-1">{currentApproval.description}</p>
                </div>

                {isPending && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setModalState({ isOpen: true, action: 'reject' })}
                            className="px-4 py-2 border border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => setModalState({ isOpen: true, action: 'approve' })}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Approve
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Requester Info */}
                <Card className="lg:col-span-1">
                    <CardHeader title="Requester" />
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Avatar
                                name={currentApproval.requester.full_name}
                                src={currentApproval.requester.avatar}
                                size="lg"
                            />
                            <div>
                                <p className="font-medium text-surface-900 dark:text-white">
                                    {currentApproval.requester.full_name}
                                </p>
                                <p className="text-sm text-surface-500">
                                    {currentApproval.requester.designation}
                                </p>
                                <p className="text-sm text-surface-400">
                                    {currentApproval.requester.department}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-surface-500">Employee ID</span>
                                <span className="text-surface-900 dark:text-white">{currentApproval.requester.employee_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-500">Request Type</span>
                                <span className="text-surface-900 dark:text-white capitalize">{currentApproval.request_type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-surface-500">Submitted</span>
                                <span className="text-surface-900 dark:text-white">{formatDate(currentApproval.created_at)}</span>
                            </div>
                            {currentApproval.sla_deadline && (
                                <div className="flex justify-between">
                                    <span className="text-surface-500">SLA Deadline</span>
                                    <span className={currentApproval.is_overdue ? 'text-red-600' : 'text-surface-900 dark:text-white'}>
                                        {formatDate(currentApproval.sla_deadline)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Workflow Timeline */}
                <Card className="lg:col-span-2">
                    <CardHeader title="Approval Workflow" subtitle={`Step ${currentApproval.current_step} of ${currentApproval.total_steps}`} />
                    <CardContent>
                        <WorkflowTimeline
                            steps={currentApproval.steps}
                            currentStep={currentApproval.current_step}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Action Modal */}
            <ApprovalActionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                onConfirm={handleConfirm}
                action={modalState.action}
                title={currentApproval.title}
                isLoading={isSubmitting}
            />
        </div>
    )
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
