/**
 * Onboarding Admin Page - Manage templates and track all onboardings
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    PlusIcon,
    XMarkIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ChevronRightIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { onboardingService, OnboardingTemplate, EmployeeOnboarding, OnboardingSummary } from '@/services/onboardingService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function OnboardingAdminPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'onboardings'>('dashboard')
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null>(null)

    // Get summary
    const { data: summary } = useQuery({
        queryKey: ['onboarding-summary'],
        queryFn: () => onboardingService.getOnboardingSummary(),
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                        Onboarding Management
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mt-1">
                        Manage templates and track employee onboarding progress
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingTemplate(null)
                        setShowTemplateModal(true)
                    }}
                    className="btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Template
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg w-fit">
                {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'templates', label: 'Templates' },
                    { id: 'onboardings', label: 'All Onboardings' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow'
                                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'dashboard' && <OnboardingDashboard summary={summary} />}
            {activeTab === 'templates' && (
                <TemplatesTab
                    onEdit={(t) => {
                        setEditingTemplate(t)
                        setShowTemplateModal(true)
                    }}
                />
            )}
            {activeTab === 'onboardings' && <OnboardingsTab />}

            {/* Template Modal */}
            {showTemplateModal && (
                <TemplateModal
                    template={editingTemplate}
                    onClose={() => {
                        setShowTemplateModal(false)
                        setEditingTemplate(null)
                    }}
                />
            )}
        </div>
    )
}

function OnboardingDashboard({ summary }: { summary?: OnboardingSummary }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-blue-500" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-surface-900 dark:text-white">
                    {summary?.total_onboardings || 0}
                </p>
                <p className="text-sm text-surface-500">Total Onboardings</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-amber-500" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-surface-900 dark:text-white">
                    {summary?.in_progress || 0}
                </p>
                <p className="text-sm text-surface-500">In Progress</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-green-500" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-surface-900 dark:text-white">
                    {summary?.completed || 0}
                </p>
                <p className="text-sm text-surface-500">Completed</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-red-500" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-surface-900 dark:text-white">
                    {summary?.overdue || 0}
                </p>
                <p className="text-sm text-surface-500">Overdue</p>
            </motion.div>
        </div>
    )
}

function TemplatesTab({ onEdit }: { onEdit: (template: OnboardingTemplate) => void }) {
    const queryClient = useQueryClient()

    const { data: templates, isLoading } = useQuery({
        queryKey: ['onboarding-templates'],
        queryFn: () => onboardingService.getTemplates(false),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => onboardingService.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] })
            toast.success('Template deleted')
        },
        onError: () => {
            toast.error('Failed to delete template')
        },
    })

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="card">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-surface-50 dark:bg-surface-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Code</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Department</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Tasks</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-surface-600 dark:text-surface-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                        {templates?.map((template) => (
                            <tr key={template.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                <td className="px-4 py-3">
                                    <p className="font-medium text-surface-900 dark:text-white">{template.name}</p>
                                    {template.is_default && (
                                        <span className="badge badge-info text-xs">Default</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{template.code}</td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                                    {template.department_name || 'All'}
                                </td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                                    {template.task_count || 0}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`badge ${template.is_active ? 'badge-success' : 'bg-surface-200 text-surface-600'}`}>
                                        {template.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => onEdit(template)}
                                            className="p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this template?')) {
                                                    deleteMutation.mutate(template.id)
                                                }
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function OnboardingsTab() {
    const { data: onboardings, isLoading } = useQuery({
        queryKey: ['all-onboardings'],
        queryFn: () => onboardingService.getOnboardings(),
    })

    const statusColors: Record<string, string> = {
        not_started: 'bg-surface-200 text-surface-600',
        in_progress: 'badge-warning',
        completed: 'badge-success',
        cancelled: 'bg-surface-200 text-surface-600',
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className="card">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-surface-50 dark:bg-surface-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Employee</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Template</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Joining</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Progress</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-surface-600 dark:text-surface-400">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-surface-600 dark:text-surface-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                        {onboardings?.map((onb) => (
                            <tr key={onb.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                                <td className="px-4 py-3">
                                    <p className="font-medium text-surface-900 dark:text-white">{onb.employee_name}</p>
                                    <p className="text-sm text-surface-500">{onb.employee_id}</p>
                                </td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                                    {onb.template_name}
                                </td>
                                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                                    {new Date(onb.joining_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-24 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 rounded-full"
                                                style={{ width: `${onb.progress_percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-surface-600 dark:text-surface-400">
                                            {onb.progress_percentage}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`badge ${statusColors[onb.status] || 'badge-info'}`}>
                                        {onb.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end">
                                        <button className="p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

interface TemplateFormData {
    name: string
    code: string
    description: string
    days_before_joining: number
    days_to_complete: number
    is_default: boolean
    is_active: boolean
}

function TemplateModal({
    template,
    onClose,
}: {
    template: OnboardingTemplate | null
    onClose: () => void
}) {
    const queryClient = useQueryClient()
    const isEdit = !!template

    const { register, handleSubmit, formState: { errors } } = useForm<TemplateFormData>({
        defaultValues: template || {
            name: '',
            code: '',
            description: '',
            days_before_joining: 7,
            days_to_complete: 30,
            is_default: false,
            is_active: true,
        },
    })

    const createMutation = useMutation({
        mutationFn: (data: Partial<OnboardingTemplate>) => onboardingService.createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] })
            toast.success('Template created')
            onClose()
        },
        onError: () => {
            toast.error('Failed to create template')
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: Partial<OnboardingTemplate>) => onboardingService.updateTemplate(template!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] })
            toast.success('Template updated')
            onClose()
        },
        onError: () => {
            toast.error('Failed to update template')
        },
    })

    const onSubmit = (data: TemplateFormData) => {
        if (isEdit) {
            updateMutation.mutate(data)
        } else {
            createMutation.mutate(data)
        }
    }

    const isPending = createMutation.isPending || updateMutation.isPending

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass-card p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">
                        {isEdit ? 'Edit Template' : 'New Template'}
                    </h2>
                    <button onClick={onClose} className="text-surface-500 hover:text-surface-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="form-label">Name</label>
                            <input
                                type="text"
                                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                                {...register('name', { required: 'Required' })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Code</label>
                            <input
                                type="text"
                                className={`form-input ${errors.code ? 'form-input-error' : ''}`}
                                {...register('code', { required: 'Required' })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Days to Complete</label>
                            <input
                                type="number"
                                className="form-input"
                                {...register('days_to_complete', { valueAsNumber: true })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="form-label">Description</label>
                            <textarea
                                rows={2}
                                className="form-input"
                                {...register('description')}
                            />
                        </div>
                    </div>

                    <div className="flex space-x-6">
                        <label className="flex items-center">
                            <input type="checkbox" className="form-checkbox" {...register('is_active')} />
                            <span className="ml-2">Active</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" className="form-checkbox" {...register('is_default')} />
                            <span className="ml-2">Default Template</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending} className="btn-primary">
                            {isPending ? <LoadingSpinner size="sm" /> : isEdit ? 'Save Changes' : 'Create Template'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
