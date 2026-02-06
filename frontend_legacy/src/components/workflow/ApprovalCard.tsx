/**
 * ApprovalCard Component - Display approval request in list
 */

import { Link } from 'react-router-dom'
import { ApprovalRequest } from '@/services/workflowService'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

interface ApprovalCardProps {
    approval: ApprovalRequest
    showActions?: boolean
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
}

const typeConfig: Record<string, { label: string; color: string }> = {
    leave: { label: 'Leave', color: 'bg-blue-500' },
    attendance: { label: 'Attendance', color: 'bg-green-500' },
    expense: { label: 'Expense', color: 'bg-purple-500' },
    timesheet: { label: 'Timesheet', color: 'bg-indigo-500' },
    resignation: { label: 'Resignation', color: 'bg-red-500' },
    loan: { label: 'Loan', color: 'bg-amber-500' },
}

const priorityBadge: Record<string, { variant: 'default' | 'warning' | 'error'; label: string }> = {
    low: { variant: 'default', label: 'Low' },
    normal: { variant: 'default', label: 'Normal' },
    high: { variant: 'warning', label: 'High' },
    urgent: { variant: 'error', label: 'Urgent' },
}

export default function ApprovalCard({
    approval,
    showActions = true,
    onApprove,
    onReject
}: ApprovalCardProps) {
    const typeInfo = typeConfig[approval.request_type] || { label: approval.request_type, color: 'bg-surface-500' }
    const priorityInfo = priorityBadge[approval.priority]

    return (
        <div className={`
      bg-white dark:bg-surface-800 border rounded-xl p-4
      ${approval.is_overdue
                ? 'border-red-300 dark:border-red-600/50'
                : 'border-surface-200 dark:border-surface-700'
            }
      hover:shadow-md transition-shadow
    `}>
            <div className="flex items-start gap-4">
                {/* Type indicator */}
                <div className={`w-1 h-full min-h-[60px] rounded-full ${typeInfo.color}`} />

                {/* Avatar */}
                <Avatar
                    name={approval.requester.full_name}
                    src={approval.requester.avatar}
                    size="md"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <Link
                                to={`/workflows/approvals/${approval.id}`}
                                className="font-medium text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                            >
                                {approval.title}
                            </Link>
                            <p className="text-sm text-surface-500 mt-0.5">
                                {approval.requester.full_name} · {approval.requester.department}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={priorityInfo?.variant || 'default'} size="sm">
                                {priorityInfo?.label || approval.priority}
                            </Badge>
                            {approval.is_overdue && (
                                <Badge variant="error" size="sm" dot>Overdue</Badge>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {approval.description && (
                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 line-clamp-2">
                            {approval.description}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-xs text-surface-500">
                            <span className="flex items-center gap-1">
                                <TypeIcon />
                                {typeInfo.label}
                            </span>
                            <span className="flex items-center gap-1">
                                <StepIcon />
                                Step {approval.current_step}/{approval.total_steps}
                            </span>
                            <span>{formatTimeAgo(approval.created_at)}</span>
                        </div>

                        {showActions && (
                            <div className="flex items-center gap-2">
                                {onReject && (
                                    <button
                                        onClick={() => onReject(approval.id)}
                                        className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        Reject
                                    </button>
                                )}
                                {onApprove && (
                                    <button
                                        onClick={() => onApprove(approval.id)}
                                        className="px-3 py-1 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
                                    >
                                        Approve
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Icons
function TypeIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    )
}

function StepIcon() {
    return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    )
}

function formatTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
}
