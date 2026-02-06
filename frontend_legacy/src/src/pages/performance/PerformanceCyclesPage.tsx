/**
 * Performance Cycles Page (Admin)
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { performanceService } from '@/services/performanceService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function PerformanceCyclesPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCycle, setEditingCycle] = useState<any>(null)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        year: new Date().getFullYear(),
        start_date: '',
        end_date: '',
        status: 'draft'
    })

    const { data: cycles, isLoading } = useQuery({
        queryKey: ['performance-cycles'],
        queryFn: performanceService.getPerformanceCycles
    })

    const mutation = useMutation({
        mutationFn: (data: any) =>
            editingCycle
                ? performanceService.updatePerformanceCycle(editingCycle.id, data)
                : performanceService.createPerformanceCycle(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['performance-cycles'] })
            toast.success(editingCycle ? 'Cycle updated successfully' : 'Cycle created successfully')
            handleClose()
        },
        onError: (err: any) => {
            const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to save cycle'
            setError(errorMsg)
            toast.error(errorMsg)
        }
    })

    const handleEdit = (cycle: any) => {
        setEditingCycle(cycle)
        setFormData({
            name: cycle.name,
            year: cycle.year,
            start_date: cycle.start_date,
            end_date: cycle.end_date,
            status: cycle.status
        })
        setIsModalOpen(true)
    }

    const handleClose = () => {
        setIsModalOpen(false)
        setEditingCycle(null)
        setError('')
        setFormData({
            name: '',
            year: new Date().getFullYear(),
            start_date: '',
            end_date: '',
            status: 'draft'
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        mutation.mutate(formData)
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Performance Cycles</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    Create Cycle
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.isArray(cycles) && cycles.map((cycle) => (
                    <div key={cycle.id} className="card p-6 border-l-4 border-l-primary-500 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-surface-900 dark:text-white">{cycle.name}</h3>
                                <p className="text-sm text-surface-500">Year: {cycle.year}</p>
                            </div>
                            <span className={`badge ${cycle.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                                {cycle.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm text-surface-600 dark:text-surface-400 mb-4">
                            <div className="flex justify-between">
                                <span>Start:</span>
                                <span className="font-medium">{cycle.start_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>End:</span>
                                <span className="font-medium">{cycle.end_date}</span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-surface-100 dark:border-surface-700">
                            <button
                                onClick={() => handleEdit(cycle)}
                                className="text-surface-500 hover:text-primary-600 flex items-center gap-1 text-sm"
                            >
                                <PencilIcon className="w-4 h-4" />
                                Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title={editingCycle ? 'Edit Cycle' : 'Create Performance Cycle'}
            >
                <form onSubmit={handleSubmit} className="h-full flex flex-col">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto pr-2 pb-4">
                        <div className="space-y-5">
                            <div>
                                <label className="label">Cycle Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Annual Review 2024"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label">Year <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Status</label>
                                    <select
                                        className="input w-full"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="review">Review Phase</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="label">Start Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        className="input w-full"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">End Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        className="input w-full"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700 mt-4">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : 'Save Cycle'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
