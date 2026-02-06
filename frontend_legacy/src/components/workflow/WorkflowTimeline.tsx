/**
 * WorkflowTimeline Component - Visual timeline of approval steps
 */

import { WorkflowStep } from '@/services/workflowService'
import Avatar from '@/components/ui/Avatar'

interface WorkflowTimelineProps {
    steps: WorkflowStep[]
    currentStep: number
}

const stepStatusConfig = {
    pending: {
        bgColor: 'bg-surface-200 dark:bg-surface-700',
        iconColor: 'text-surface-400',
        lineColor: 'bg-surface-200 dark:bg-surface-700',
    },
    approved: {
        bgColor: 'bg-green-500',
        iconColor: 'text-white',
        lineColor: 'bg-green-500',
    },
    rejected: {
        bgColor: 'bg-red-500',
        iconColor: 'text-white',
        lineColor: 'bg-red-500',
    },
    skipped: {
        bgColor: 'bg-surface-300 dark:bg-surface-600',
        iconColor: 'text-surface-500',
        lineColor: 'bg-surface-300 dark:bg-surface-600',
    },
}

export default function WorkflowTimeline({ steps, currentStep }: WorkflowTimelineProps) {
    return (
        <div className="relative">
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1
                const isCurrent = step.order === currentStep
                const config = stepStatusConfig[step.status]

                return (
                    <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Vertical line (except for last) */}
                        {!isLast && (
                            <div
                                className={`absolute left-4 top-8 bottom-0 w-0.5 ${config.lineColor}`}
                                style={{ transform: 'translateX(-50%)' }}
                            />
                        )}

                        {/* Step indicator */}
                        <div className={`
              relative z-10 flex-shrink-0 w-8 h-8 rounded-full 
              ${config.bgColor}
              flex items-center justify-center
              ${isCurrent ? 'ring-4 ring-primary-200 dark:ring-primary-900' : ''}
            `}>
                            <StepIcon status={step.status} className={config.iconColor} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className={`font-medium ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-surface-900 dark:text-white'}`}>
                                        {step.name}
                                    </h4>
                                    <p className="text-sm text-surface-500 mt-0.5">
                                        {getApproverLabel(step)}
                                    </p>
                                </div>

                                {step.completed_at && (
                                    <span className="text-xs text-surface-400">
                                        {formatDate(step.completed_at)}
                                    </span>
                                )}
                            </div>

                            {/* Completed by info */}
                            {step.completed_by && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Avatar name={step.completed_by.full_name} size="xs" />
                                    <span className="text-sm text-surface-600 dark:text-surface-400">
                                        {step.status === 'approved' ? 'Approved' : step.status === 'rejected' ? 'Rejected' : 'Completed'} by {step.completed_by.full_name}
                                    </span>
                                </div>
                            )}

                            {/* Comments */}
                            {step.comments && (
                                <div className="mt-2 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                                    <p className="text-sm text-surface-600 dark:text-surface-400 italic">
                                        "{step.comments}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function StepIcon({ status, className }: { status: string; className: string }) {
    switch (status) {
        case 'approved':
            return (
                <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            )
        case 'rejected':
            return (
                <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            )
        case 'skipped':
            return (
                <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                </svg>
            )
        default: // pending
            return (
                <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
            )
    }
}

function getApproverLabel(step: WorkflowStep): string {
    if (step.approver_user) return step.approver_user.full_name
    if (step.approver_role) return step.approver_role.name

    switch (step.approver_type) {
        case 'manager': return 'Reporting Manager'
        case 'skip_level_manager': return 'Skip-Level Manager'
        default: return step.approver_type
    }
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}
