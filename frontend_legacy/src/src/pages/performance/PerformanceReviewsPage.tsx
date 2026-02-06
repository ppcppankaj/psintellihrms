/**
 * Performance Reviews Page
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ClipboardDocumentCheckIcon,
    UserIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { performanceService } from '@/services/performanceService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'

export default function PerformanceReviewsPage() {
    const [activeTab, setActiveTab] = useState<'my_reviews' | 'team_reviews'>('my_reviews')
    // const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => ({ is_manager: true }) }) 

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Performance Reviews
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Manage your performance reviews and feedback
                </p>
            </div>

            <div className="flex space-x-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('my_reviews')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'my_reviews'
                        ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                        }`}
                >
                    <UserIcon className="w-4 h-4 mr-2" />
                    My Reviews
                </button>
                {/* Only show if manager */}
                <button
                    onClick={() => setActiveTab('team_reviews')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'team_reviews'
                        ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                        }`}
                >
                    <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                    Team Reviews
                </button>
            </div>

            {activeTab === 'my_reviews' && <MyReviewsTab />}
            {activeTab === 'team_reviews' && <TeamReviewsTab />}
        </div>
    )
}

function MyReviewsTab() {
    const queryClient = useQueryClient()
    const { data: reviews, isLoading } = useQuery({
        queryKey: ['my-reviews'],
        queryFn: performanceService.getMyReviews,
    })

    const [selectedReview, setSelectedReview] = useState<any>(null)
    const [formData, setFormData] = useState({ self_rating: 0, self_comments: '' })

    const submitMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            performanceService.submitReviewSelfRating(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
            toast.success('Self review submitted successfully')
            setSelectedReview(null)
        },
        onError: (err: any) => {
            const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to submit review'
            toast.error(errorMsg)
        }
    })

    if (isLoading) return <LoadingSpinner />

    return (
        <>
            <div className="grid gap-4">
                {reviews?.map((review) => (
                    <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-4 border-l-4 border-l-primary-500"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-surface-900 dark:text-white">
                                    {review.cycle_details?.name}
                                </h3>
                                <p className="text-sm text-surface-500">
                                    Period: {review.cycle_details?.start_date} - {review.cycle_details?.end_date}
                                </p>
                            </div>
                            <span className={`badge ${review.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                {review.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                                <span className="text-surface-500 block">Self Rating</span>
                                <span className="font-bold text-lg">{review.self_rating || '-'}</span>
                            </div>
                            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                                <span className="text-surface-500 block">Manager Rating</span>
                                <span className="font-bold text-lg">{review.manager_rating || '-'}</span>
                            </div>
                        </div>

                        {review.status === 'self_review' && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => {
                                        setSelectedReview(review)
                                        setFormData({ self_rating: review.self_rating || 0, self_comments: review.self_comments || '' })
                                    }}
                                    className="btn-primary"
                                >
                                    Start Self Review
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <Modal
                isOpen={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                title={`Self Review: ${selectedReview?.cycle_details?.name}`}
                size="lg"
            >
                <div className="space-y-5">
                    <div>
                        <label className="label">Overall Rating (1-5) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            className="input w-full"
                            value={formData.self_rating}
                            onChange={(e) => setFormData({ ...formData, self_rating: parseFloat(e.target.value) })}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Comments / Achievements</label>
                        <textarea
                            rows={5}
                            className="input w-full"
                            value={formData.self_comments}
                            onChange={(e) => setFormData({ ...formData, self_comments: e.target.value })}
                            placeholder="Describe your performance, key achievements, and areas of improvement..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                        <button onClick={() => setSelectedReview(null)} className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">Cancel</button>
                        <button
                            onClick={() => submitMutation.mutate({ id: selectedReview.id, data: formData })}
                            disabled={!formData.self_rating || submitMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

function TeamReviewsTab() {
    const queryClient = useQueryClient()
    const { data: reviews, isLoading } = useQuery({
        queryKey: ['team-reviews'],
        queryFn: () => performanceService.getPerformanceReviews(), // Add filters if needed
    })

    const [selectedReview, setSelectedReview] = useState<any>(null)
    const [formData, setFormData] = useState({ manager_rating: 0, manager_comments: '' })

    const submitMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            performanceService.submitReviewManagerRating(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-reviews'] })
            toast.success('Manager review submitted')
            setSelectedReview(null)
        },
    })

    if (isLoading) return <LoadingSpinner />

    return (
        <>
            <div className="grid gap-4">
                {reviews?.map((review) => (
                    <motion.div
                        key={review.id}
                        className="card p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                {review.employee_details?.avatar ? (
                                    <img src={review.employee_details.avatar} alt="" className="w-10 h-10 rounded-full" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                        {review.employee_details?.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-surface-900 dark:text-white">
                                        {review.employee_details?.full_name}
                                    </h3>
                                    <p className="text-sm text-surface-500">{review.employee_details?.designation_name}</p>
                                </div>
                            </div>
                            <span className={`badge ${review.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                                {review.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <span className="text-surface-500 block text-xs uppercase">Self Rating</span>
                                    <span className="font-medium">{review.self_rating || 'Pending'}</span>
                                </div>
                                <div>
                                    <span className="text-surface-500 block text-xs uppercase">Manager Rating</span>
                                    <span className="font-medium">{review.manager_rating || '-'}</span>
                                </div>
                            </div>

                            {review.status === 'manager_review' && (
                                <button
                                    onClick={() => {
                                        setSelectedReview(review)
                                        setFormData({ manager_rating: review.manager_rating || 0, manager_comments: review.manager_comments || '' })
                                    }}
                                    className="btn-primary w-full"
                                >
                                    Review Employee
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <Modal
                isOpen={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                title={`Manager Review: ${selectedReview?.employee_details?.full_name}`}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">Employee Self Review</h4>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm text-surface-600">Rating:</span>
                            <span className="font-bold">{selectedReview?.self_rating}</span>
                        </div>
                        <p className="text-sm text-surface-600 italic">"{selectedReview?.self_comments}"</p>
                    </div>

                    <div>
                        <label className="form-label">Your Rating (1-5)</label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            className="form-input"
                            value={formData.manager_rating}
                            onChange={(e) => setFormData({ ...formData, manager_rating: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="form-label">Manager Comments</label>
                        <textarea
                            rows={5}
                            className="form-input"
                            value={formData.manager_comments}
                            onChange={(e) => setFormData({ ...formData, manager_comments: e.target.value })}
                            placeholder="Provide feedback..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setSelectedReview(null)} className="btn-secondary">Cancel</button>
                        <button
                            onClick={() => submitMutation.mutate({ id: selectedReview.id, data: formData })}
                            disabled={!formData.manager_rating || submitMutation.isPending}
                            className="btn-primary"
                        >
                            {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
