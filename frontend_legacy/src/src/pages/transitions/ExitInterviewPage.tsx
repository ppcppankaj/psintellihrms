/**
 * Exit Interview Page - Complete exit interview form
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    ClipboardDocumentCheckIcon,
    StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { transitionsService, ExitInterviewFormData } from '@/services/transitionsService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ExitInterviewPage() {
    // Get my resignation
    const { data: myResignation, isLoading } = useQuery({
        queryKey: ['my-resignation'],
        queryFn: () => transitionsService.getMyResignation(),
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!myResignation || myResignation.status !== 'accepted') {
        return (
            <div className="text-center py-16">
                <ClipboardDocumentCheckIcon className="w-16 h-16 mx-auto text-surface-400 mb-4" />
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                    No Exit Interview Required
                </h2>
                <p className="text-surface-600 dark:text-surface-400">
                    The exit interview form is available after your resignation is accepted.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Exit Interview
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Please share your feedback to help us improve
                </p>
            </div>

            <ExitInterviewForm resignationId={myResignation.id} />
        </div>
    )
}

function ExitInterviewForm({ resignationId }: { resignationId: string }) {
    const queryClient = useQueryClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: existingInterview, isLoading } = useQuery({
        queryKey: ['exit-interview', resignationId],
        queryFn: () => transitionsService.getExitInterview(resignationId),
    })

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ExitInterviewFormData>({
        defaultValues: existingInterview || {
            interview_date: today,
            job_satisfaction: 0,
            work_life_balance: 0,
            management_support: 0,
            growth_opportunities: 0,
            compensation_satisfaction: 0,
            work_environment: 0,
            team_collaboration: 0,
            reason_for_leaving: '',
            liked_most: '',
            improvements_suggested: '',
            would_recommend: true,
            would_return: true,
        },
    })

    const submitMutation = useMutation({
        mutationFn: (data: ExitInterviewFormData) => transitionsService.submitExitInterview(resignationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exit-interview', resignationId] })
            toast.success('Exit interview submitted. Thank you for your feedback!')
        },
        onError: () => {
            toast.error('Failed to submit exit interview')
        },
    })

    const onSubmit = (data: ExitInterviewFormData) => {
        submitMutation.mutate(data)
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    if (existingInterview?.is_completed) {
        return (
            <div className="card p-8 text-center">
                <ClipboardDocumentCheckIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                    Exit Interview Completed
                </h2>
                <p className="text-surface-600 dark:text-surface-400">
                    Thank you for your valuable feedback!
                </p>
            </div>
        )
    }

    const ratingFields = [
        { name: 'job_satisfaction', label: 'Job Satisfaction' },
        { name: 'work_life_balance', label: 'Work-Life Balance' },
        { name: 'management_support', label: 'Management Support' },
        { name: 'growth_opportunities', label: 'Growth Opportunities' },
        { name: 'compensation_satisfaction', label: 'Compensation & Benefits' },
        { name: 'work_environment', label: 'Work Environment' },
        { name: 'team_collaboration', label: 'Team Collaboration' },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Rating Section */}
                <div>
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                        Rate Your Experience
                    </h3>
                    <div className="space-y-4">
                        {ratingFields.map((field) => (
                            <RatingField
                                key={field.name}
                                label={field.label}
                                value={watch(field.name as keyof ExitInterviewFormData) as number || 0}
                                onChange={(val) => setValue(field.name as keyof ExitInterviewFormData, val)}
                            />
                        ))}
                    </div>
                </div>

                {/* Open Questions */}
                <div className="space-y-4">
                    <div>
                        <label className="form-label">What is your primary reason for leaving?</label>
                        <textarea
                            rows={3}
                            className={`form-input ${errors.reason_for_leaving ? 'form-input-error' : ''}`}
                            placeholder="Please share your main reason..."
                            {...register('reason_for_leaving', { required: 'This field is required' })}
                        />
                    </div>

                    <div>
                        <label className="form-label">What did you like most about working here?</label>
                        <textarea
                            rows={3}
                            className="form-input"
                            placeholder="Share positive experiences..."
                            {...register('liked_most')}
                        />
                    </div>

                    <div>
                        <label className="form-label">What improvements would you suggest?</label>
                        <textarea
                            rows={3}
                            className="form-input"
                            placeholder="Your suggestions for improvement..."
                            {...register('improvements_suggested')}
                        />
                    </div>
                </div>

                {/* Yes/No Questions */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="font-medium text-surface-900 dark:text-white mb-3">
                            Would you recommend this company to others?
                        </p>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    value="true"
                                    {...register('would_recommend')}
                                />
                                <span className="ml-2">Yes</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    value="false"
                                    {...register('would_recommend')}
                                />
                                <span className="ml-2">No</span>
                            </label>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
                        <p className="font-medium text-surface-900 dark:text-white mb-3">
                            Would you consider returning in the future?
                        </p>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    value="true"
                                    {...register('would_return')}
                                />
                                <span className="ml-2">Yes</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    value="false"
                                    {...register('would_return')}
                                />
                                <span className="ml-2">No</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4 border-t border-surface-200 dark:border-surface-700">
                    <button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="btn-primary"
                    >
                        {submitMutation.isPending ? <LoadingSpinner size="sm" /> : 'Submit Exit Interview'}
                    </button>
                </div>
            </form>
        </motion.div>
    )
}

function RatingField({
    label,
    value,
    onChange,
}: {
    label: string
    value: number
    onChange: (val: number) => void
}) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
            <span className="text-surface-700 dark:text-surface-300">{label}</span>
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="p-1 hover:scale-110 transition-transform"
                    >
                        {star <= value ? (
                            <StarSolidIcon className="w-6 h-6 text-yellow-400" />
                        ) : (
                            <StarIcon className="w-6 h-6 text-surface-300" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}
