/**
 * Onboarding Page - View and complete onboarding tasks
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    CheckCircleIcon,
    ClockIcon,
    DocumentIcon,
    ExclamationCircleIcon,
    ChevronRightIcon,
    UserGroupIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
import { onboardingService, EmployeeOnboarding, OnboardingTask } from '@/services/onboardingService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function OnboardingPage() {
    const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null)

    // Get my onboarding
    const { data: myOnboarding, isLoading: isLoadingOnboarding } = useQuery({
        queryKey: ['my-onboarding'],
        queryFn: () => onboardingService.getMyOnboarding(),
    })

    // Get my tasks
    const { data: myTasks, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['my-onboarding-tasks'],
        queryFn: () => onboardingService.getMyTasks(),
    })

    // Group tasks by stage
    const tasksByStage = myTasks?.reduce((acc, task) => {
        const stage = task.stage
        if (!acc[stage]) acc[stage] = []
        acc[stage].push(task)
        return acc
    }, {} as Record<string, OnboardingTask[]>) || {}

    const stageOrder = ['pre_joining', 'day_one', 'first_week', 'first_month', 'post_onboarding']
    const stageLabels: Record<string, string> = {
        pre_joining: 'Pre-Joining',
        day_one: 'Day One',
        first_week: 'First Week',
        first_month: 'First Month',
        post_onboarding: 'Post Onboarding',
    }

    if (isLoadingOnboarding || isLoadingTasks) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!myOnboarding) {
        return (
            <div className="text-center py-16">
                <UserGroupIcon className="w-16 h-16 mx-auto text-surface-400 mb-4" />
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                    No Active Onboarding
                </h2>
                <p className="text-surface-600 dark:text-surface-400">
                    Your onboarding process hasn't started yet or has been completed.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                        My Onboarding
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mt-1">
                        Complete your onboarding tasks to get started
                    </p>
                </div>
            </div>

            {/* Progress Overview */}
            <OnboardingProgressCard onboarding={myOnboarding} />

            {/* Tasks by Stage */}
            <div className="space-y-6">
                {stageOrder.map((stage) => {
                    const tasks = tasksByStage[stage]
                    if (!tasks || tasks.length === 0) return null

                    return (
                        <div key={stage} className="card">
                            <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                    {stageLabels[stage]}
                                </h2>
                            </div>
                            <div className="divide-y divide-surface-200 dark:divide-surface-700">
                                {tasks.map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        onClick={() => setSelectedTask(task)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                />
            )}
        </div>
    )
}

function OnboardingProgressCard({ onboarding }: { onboarding: EmployeeOnboarding }) {
    const progressPercentage = onboarding.progress_percentage || 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Progress Circle */}
                <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                className="stroke-surface-200 dark:stroke-surface-700"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                className="stroke-primary-500"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${progressPercentage * 3.52} 352`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-surface-900 dark:text-white">
                                {progressPercentage}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <div className="flex items-center mb-2">
                            <CheckCircleSolidIcon className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-sm text-surface-600 dark:text-surface-400">Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white">
                            {onboarding.completed_tasks}
                        </p>
                    </div>

                    <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <div className="flex items-center mb-2">
                            <ClockIcon className="w-5 h-5 text-amber-500 mr-2" />
                            <span className="text-sm text-surface-600 dark:text-surface-400">Remaining</span>
                        </div>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white">
                            {onboarding.total_tasks - onboarding.completed_tasks}
                        </p>
                    </div>

                    <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <div className="flex items-center mb-2">
                            <CalendarDaysIcon className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="text-sm text-surface-600 dark:text-surface-400">Target Date</span>
                        </div>
                        <p className="text-lg font-semibold text-surface-900 dark:text-white">
                            {new Date(onboarding.target_completion_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function TaskRow({ task, onClick }: { task: OnboardingTask; onClick: () => void }) {
    const statusConfig: Record<string, { icon: React.ElementType; className: string }> = {
        completed: { icon: CheckCircleSolidIcon, className: 'text-green-500' },
        in_progress: { icon: ClockIcon, className: 'text-blue-500' },
        pending: { icon: ClockIcon, className: 'text-surface-400' },
        overdue: { icon: ExclamationCircleIcon, className: 'text-red-500' },
        skipped: { icon: CheckCircleIcon, className: 'text-surface-400' },
    }

    const config = statusConfig[task.status] || statusConfig.pending
    const Icon = config.icon
    const isActionable = task.status === 'pending' || task.status === 'overdue'

    return (
        <button
            onClick={onClick}
            disabled={!isActionable}
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isActionable ? 'hover:bg-surface-50 dark:hover:bg-surface-800' : 'opacity-60'
                }`}
        >
            <div className="flex items-center">
                <Icon className={`w-6 h-6 mr-4 ${config.className}`} />
                <div>
                    <p className={`font-medium ${task.status === 'completed'
                        ? 'text-surface-500 line-through'
                        : 'text-surface-900 dark:text-white'
                        }`}>
                        {task.title}
                    </p>
                    <p className="text-sm text-surface-500">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                        {task.assigned_to_name && ` · ${task.assigned_to_name}`}
                    </p>
                </div>
            </div>
            {isActionable && (
                <ChevronRightIcon className="w-5 h-5 text-surface-400" />
            )}
        </button>
    )
}

function TaskDetailModal({ task, onClose }: { task: OnboardingTask; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [notes, setNotes] = useState('')
    const [acknowledged, setAcknowledged] = useState(false)

    const completeMutation = useMutation({
        mutationFn: () => onboardingService.completeTask(task.id, { notes, acknowledged }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-onboarding-tasks'] })
            queryClient.invalidateQueries({ queryKey: ['my-onboarding'] })
            toast.success('Task completed!')
            onClose()
        },
        onError: () => {
            toast.error('Failed to complete task')
        },
    })

    const isCompleted = task.status === 'completed'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass-card p-6"
            >
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                            {task.title}
                        </h2>
                        <p className="text-sm text-surface-500 mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                    </div>
                    <span className={`badge ${task.is_mandatory ? 'badge-error' : 'badge-info'
                        }`}>
                        {task.is_mandatory ? 'Required' : 'Optional'}
                    </span>
                </div>

                {task.description && (
                    <div className="mb-6 p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="text-surface-700 dark:text-surface-300">
                            {task.description}
                        </p>
                    </div>
                )}

                {!isCompleted && (
                    <div className="space-y-4">
                        {/* Notes */}
                        <div>
                            <label className="form-label">Notes (Optional)</label>
                            <textarea
                                rows={3}
                                className="form-input"
                                placeholder="Add any notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Acknowledgement */}
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                            />
                            <span className="ml-2 text-surface-700 dark:text-surface-300">
                                I acknowledge completing this task
                            </span>
                        </label>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-surface-200 dark:border-surface-700 mt-6">
                    <button onClick={onClose} className="btn-secondary">
                        {isCompleted ? 'Close' : 'Cancel'}
                    </button>
                    {!isCompleted && (
                        <button
                            onClick={() => completeMutation.mutate()}
                            disabled={completeMutation.isPending}
                            className="btn-primary"
                        >
                            {completeMutation.isPending ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    Complete Task
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
