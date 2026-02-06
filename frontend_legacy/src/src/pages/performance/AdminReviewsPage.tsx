
import { useState } from 'react'
import EnterpriseTable, { Column, PaginatedData, TableState } from '@/components/ui/EnterpriseTable'
import { performanceService } from '@/services/performanceService'
import Modal from '@/components/ui/Modal'
import { EyeIcon } from '@heroicons/react/24/outline'

export default function AdminReviewsPage() {
    // We reuse the existing getPerformanceReviews but without employee/cycle filters initially
    // to fetch all.

    // For specific detail view, we might reuse 'ReviewForm' components or just show JSON/Structure for now 
    // since the user request is "CRUD from as per backend" and backend has standard CRUD.
    // However, frontend review forms are complex (Self/Manager). 
    // Admins usually just want to see status or force unlock.
    // For now, let's list them and allow viewing details.

    const [selectedReview, setSelectedReview] = useState<any | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchData = async (state: TableState): Promise<PaginatedData<any>> => {
        const filters: any = {}
        if (state.search) filters.search = state.search
        // Pass empty filters to get all
        const response = await performanceService.getPerformanceReviews(filters)

        if (Array.isArray(response)) {
            return {
                results: response,
                count: response.length,
                next: null,
                previous: null
            }
        }
        return response as any
    }

    const columns: Column<any>[] = [
        {
            key: 'employee',
            header: 'Employee',
            render: (_, row) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.employee_name || row.employee_details?.full_name || row.employee}</span>
                    <span className="text-xs text-surface-500">{row.employee_details?.employee_id || ''}</span>
                </div>
            )
        },
        {
            key: 'cycle',
            header: 'Cycle',
            render: (_, row) => row.cycle_name || row.cycle_details?.name || row.cycle
        },
        {
            key: 'status',
            header: 'Status',
            render: (val) => (
                <span className={`badge ${val === 'completed' ? 'badge-success' :
                        val === 'manager_review' ? 'badge-warning' :
                            val === 'self_review' ? 'badge-info' :
                                'badge-secondary'
                    } `}>
                    {String(val).replace('_', ' ').toUpperCase()}
                </span>
            )
        },
        {
            key: 'ratings',
            header: 'Ratings',
            render: (_, row) => (
                <div className="text-sm">
                    {row.final_rating ? (
                        <span className="font-bold text-primary-600">Final: {row.final_rating}</span>
                    ) : (
                        <span className="text-surface-400">-</span>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            width: '100px',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedReview(row); setIsModalOpen(true); }}
                        className="p-1.5 text-surface-500 hover:text-primary-600 rounded-lg"
                    >
                        <EyeIcon className="w-4 h-4" />
                    </button>
                    {/* Admin Delete could be added here if needed */}
                </div>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">All Performance Reviews</h1>

            <EnterpriseTable
                columns={columns}
                fetchData={fetchData}
                rowKey="id"
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Review Details"
            >
                {selectedReview && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-surface-500">Employee</label>
                                <div className="font-medium text-surface-900 dark:text-white">
                                    {selectedReview.employee_name || selectedReview.employee_details?.full_name}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-surface-500">Status</label>
                                <div className="font-medium text-surface-900 dark:text-white">
                                    {selectedReview.status}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
                            <h3 className="font-bold mb-2">Self Review</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-surface-500">Rating</label>
                                    <div>{selectedReview.self_rating || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-surface-500">Comments</label>
                                    <div className="text-sm text-surface-600 dark:text-surface-300 italic">
                                        "{selectedReview.self_comments || 'No comments'}"
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
                            <h3 className="font-bold mb-2">Manager Review</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-surface-500">Rating</label>
                                    <div>{selectedReview.manager_rating || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-surface-500">Comments</label>
                                    <div className="text-sm text-surface-600 dark:text-surface-300 italic">
                                        "{selectedReview.manager_comments || 'No comments'}"
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
