/**
 * ApprovalActionModal Component - Modal for approve/reject actions
 */

import { useState } from 'react'

interface ApprovalActionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (comments: string) => void
    action: 'approve' | 'reject'
    title: string
    isLoading?: boolean
}

export default function ApprovalActionModal({
    isOpen,
    onClose,
    onConfirm,
    action,
    title,
    isLoading = false,
}: ApprovalActionModalProps) {
    const [comments, setComments] = useState('')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onConfirm(comments)
    }

    const isApprove = action === 'approve'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-md w-full">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                            {isApprove ? 'Approve Request' : 'Reject Request'}
                        </h3>
                        <p className="text-sm text-surface-500 mt-1">{title}</p>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Comments {!isApprove && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={4}
                            required={!isApprove}
                            placeholder={isApprove
                                ? 'Add optional comments...'
                                : 'Please provide a reason for rejection...'
                            }
                            className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (!isApprove && !comments.trim())}
                            className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isApprove
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }
              `}
                        >
                            {isLoading
                                ? 'Processing...'
                                : isApprove ? 'Approve' : 'Reject'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
