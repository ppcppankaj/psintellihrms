/**
 * TimelineTab - Employee employment history
 */

import { useEmployeeStore } from '@/store/employeeStore'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'

interface TimelineTabProps {
    employeeId: string
}

const changeTypeColors: Record<string, string> = {
    joining: 'bg-green-500',
    confirmation: 'bg-blue-500',
    promotion: 'bg-purple-500',
    transfer: 'bg-indigo-500',
    redesignation: 'bg-cyan-500',
    department_change: 'bg-teal-500',
    salary_revision: 'bg-amber-500',
    resignation: 'bg-red-500',
    termination: 'bg-red-600',
}

const changeTypeLabels: Record<string, string> = {
    joining: 'Joined',
    confirmation: 'Confirmed',
    promotion: 'Promoted',
    transfer: 'Transferred',
    redesignation: 'Redesignated',
    department_change: 'Department Changed',
    salary_revision: 'Salary Revised',
    resignation: 'Resigned',
    termination: 'Terminated',
}

export default function TimelineTab({ employeeId: _employeeId }: TimelineTabProps) {
    const { timeline, isLoadingRelated } = useEmployeeStore()

    if (isLoadingRelated) {
        return <TimelineSkeleton />
    }

    return (
        <Card>
            <CardHeader title="Employment Timeline" subtitle="History of changes and events" />
            <CardContent>
                {timeline.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-200 dark:bg-surface-700" />

                        <div className="space-y-6">
                            {timeline.map((event) => (
                                <div key={event.id} className="relative flex gap-4">
                                    {/* Dot */}
                                    <div
                                        className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                      ${changeTypeColors[event.change_type] || 'bg-surface-400'}
                    `}
                                    >
                                        <EventIcon type={event.change_type} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-6">
                                        <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium text-surface-900 dark:text-white">
                                                        {changeTypeLabels[event.change_type] || event.change_type}
                                                    </h4>
                                                    <p className="text-sm text-surface-500 mt-1">
                                                        {formatDate(event.effective_date)}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-surface-400 tabular-nums">
                                                    {getRelativeTime(event.effective_date)}
                                                </span>
                                            </div>

                                            {/* Change details */}
                                            {(event.previous_department || event.new_department) && (
                                                <div className="mt-3 text-sm">
                                                    <span className="text-surface-500">Department:</span>
                                                    <span className="ml-2 text-surface-400 line-through">{event.previous_department}</span>
                                                    <span className="mx-2">→</span>
                                                    <span className="text-surface-900 dark:text-white">{event.new_department}</span>
                                                </div>
                                            )}

                                            {(event.previous_designation || event.new_designation) && (
                                                <div className="mt-1 text-sm">
                                                    <span className="text-surface-500">Designation:</span>
                                                    <span className="ml-2 text-surface-400 line-through">{event.previous_designation}</span>
                                                    <span className="mx-2">→</span>
                                                    <span className="text-surface-900 dark:text-white">{event.new_designation}</span>
                                                </div>
                                            )}

                                            {event.remarks && (
                                                <p className="mt-3 text-sm text-surface-600 dark:text-surface-400 italic">
                                                    "{event.remarks}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function EmptyState() {
    return (
        <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">No history</h3>
            <p className="mt-1 text-sm text-surface-500">Employment events will appear here.</p>
        </div>
    )
}

function TimelineSkeleton() {
    return (
        <Card>
            <div className="animate-pulse p-6 space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 bg-surface-200 dark:bg-surface-700 rounded-full" />
                        <div className="flex-1 h-24 bg-surface-100 dark:bg-surface-700 rounded-lg" />
                    </div>
                ))}
            </div>
        </Card>
    )
}

function EventIcon({ type }: { type: string }) {
    // Simple icons based on event type
    const iconPaths: Record<string, string> = {
        joining: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        promotion: 'M5 10l7-7m0 0l7 7m-7-7v18',
        transfer: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
        default: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    }

    return (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[type] || iconPaths.default} />
        </svg>
    )
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function getRelativeTime(date: string): string {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days < 1) return 'Today'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
}
