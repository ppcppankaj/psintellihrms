/**
 * WorkflowHistoryPage - View past approval actions
 */

import { useEffect, useState } from 'react'
import { useWorkflowStore } from '@/store/workflowStore'
import ApprovalCard from '@/components/workflow/ApprovalCard'
import Card, { CardContent } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const requestTypes = [
    { value: '', label: 'All Types' },
    { value: 'leave', label: 'Leave' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'expense', label: 'Expense' },
    { value: 'timesheet', label: 'Timesheet' },
]

export default function WorkflowHistoryPage() {
    const {
        historyRequests,
        historyCount,
        isLoadingHistory,
        fetchHistory
    } = useWorkflowStore()

    const [typeFilter, setTypeFilter] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        fetchHistory({ page: currentPage, type: typeFilter || undefined })
    }, [fetchHistory, currentPage, typeFilter])

    const handleTypeChange = (type: string) => {
        setTypeFilter(type)
        setCurrentPage(1)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Workflow History
                    </h1>
                    <p className="text-surface-500 mt-1">
                        View past approval actions and decisions
                    </p>
                </div>

                {/* Filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
                >
                    {requestTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                </select>
            </div>

            {/* History List */}
            {isLoadingHistory ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <LoadingSpinner size="lg" />
                </div>
            ) : historyRequests.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    <div className="space-y-3">
                        {historyRequests.map((approval) => (
                            <ApprovalCard
                                key={approval.id}
                                approval={approval}
                                showActions={false}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {historyCount > 10 && (
                        <div className="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-700">
                            <p className="text-sm text-surface-500">
                                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, historyCount)} of {historyCount}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm rounded border border-surface-300 dark:border-surface-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 dark:hover:bg-surface-700"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage * 10 >= historyCount}
                                    className="px-3 py-1 text-sm rounded border border-surface-300 dark:border-surface-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 dark:hover:bg-surface-700"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function EmptyState() {
    return (
        <Card>
            <CardContent className="text-center py-12">
                <HistoryIcon className="mx-auto h-12 w-12 text-surface-400" />
                <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
                    No history yet
                </h3>
                <p className="mt-1 text-sm text-surface-500">
                    Your approval history will appear here.
                </p>
            </CardContent>
        </Card>
    )
}

function HistoryIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}
