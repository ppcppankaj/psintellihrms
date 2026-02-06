/**
 * ApprovalsPage - Approval inbox with pending requests
 */

import { useEffect, useState } from 'react'
import { useWorkflowStore } from '@/store/workflowStore'
import ApprovalCard from '@/components/workflow/ApprovalCard'
import ApprovalActionModal from '@/components/workflow/ApprovalActionModal'
import Card, { CardContent } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ApprovalsPage() {
    const {
        pendingApprovals,
        isLoadingPending,
        stats,
        fetchPendingApprovals,
        fetchStats,
        takeAction
    } = useWorkflowStore()

    const [modalState, setModalState] = useState<{
        isOpen: boolean
        action: 'approve' | 'reject'
        approvalId: string
        title: string
    }>({ isOpen: false, action: 'approve', approvalId: '', title: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchPendingApprovals()
        fetchStats()
    }, [fetchPendingApprovals, fetchStats])

    const handleApprove = (id: string) => {
        const approval = pendingApprovals.find(a => a.id === id)
        setModalState({
            isOpen: true,
            action: 'approve',
            approvalId: id,
            title: approval?.title || ''
        })
    }

    const handleReject = (id: string) => {
        const approval = pendingApprovals.find(a => a.id === id)
        setModalState({
            isOpen: true,
            action: 'reject',
            approvalId: id,
            title: approval?.title || ''
        })
    }

    const handleConfirm = async (comments: string) => {
        setIsSubmitting(true)
        try {
            await takeAction(modalState.approvalId, {
                action: modalState.action,
                comments
            })
            setModalState({ ...modalState, isOpen: false })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoadingPending) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Approvals
                </h1>
                <p className="text-surface-500 mt-1">
                    Review and action pending requests
                </p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Pending" value={stats.pending_count} color="primary" />
                    <StatCard label="Approved Today" value={stats.approved_today} color="green" />
                    <StatCard label="Rejected Today" value={stats.rejected_today} color="red" />
                    <StatCard label="Overdue" value={stats.overdue_count} color="amber" />
                </div>
            )}

            {/* Pending Approvals */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                    Pending Requests ({pendingApprovals.length})
                </h2>

                {pendingApprovals.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-3">
                        {pendingApprovals.map((approval) => (
                            <ApprovalCard
                                key={approval.id}
                                approval={approval}
                                onApprove={handleApprove}
                                onReject={handleReject}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Action Modal */}
            <ApprovalActionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                onConfirm={handleConfirm}
                action={modalState.action}
                title={modalState.title}
                isLoading={isSubmitting}
            />
        </div>
    )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400',
        green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    }

    return (
        <Card padding="sm">
            <CardContent>
                <p className="text-sm text-surface-500">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${colorClasses[color]?.split(' ')[1] || 'text-surface-900'}`}>
                    {value}
                </p>
            </CardContent>
        </Card>
    )
}

function EmptyState() {
    return (
        <Card>
            <CardContent className="text-center py-12">
                <InboxIcon className="mx-auto h-12 w-12 text-surface-400" />
                <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
                    All caught up!
                </h3>
                <p className="mt-1 text-sm text-surface-500">
                    No pending approvals at the moment.
                </p>
            </CardContent>
        </Card>
    )
}

function InboxIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    )
}
