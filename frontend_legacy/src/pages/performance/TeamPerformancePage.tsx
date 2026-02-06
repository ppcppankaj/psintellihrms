import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { performanceService, EmployeeKRA, KPI } from '@/services/performanceService'
import { employeeService } from '@/services/employeeService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
    ChartBarIcon,
    StarIcon,
    // ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
// import React from 'react'

export default function TeamPerformancePage() {
    const queryClient = useQueryClient()
    const [showKraModal, setShowKraModal] = useState(false)
    const [showKpiModal, setShowKpiModal] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [kraError, setKraError] = useState('')
    const [kpiError, setKpiError] = useState('')
    const [reviewError, setReviewError] = useState('')

    const [kraForm, setKraForm] = useState({
        employee: '',
        performance_cycle: '',
        kra_name: '',
        kra_description: '',
        weightage: 10
    })

    const [kpiForm, setKpiForm] = useState<Partial<KPI>>({
        employee: '',
        name: '',
        description: '',
        metric_type: 'numeric' as KPI['metric_type'],
        unit: '',
        target_value: 0,
        period_start: '',
        period_end: ''
    })

    const [reviewForm, setReviewForm] = useState({
        employee: '',
        cycle: '',
        status: 'self_review'
    })
    const [selectedKRA, setSelectedKRA] = useState<EmployeeKRA | null>(null)
    const [rating, setRating] = useState(0)
    const [comments, setComments] = useState('')

    // Fetch team KRAs
    const { data: teamKRAs, isLoading } = useQuery({
        queryKey: ['team-kras'],
        queryFn: () => performanceService.getTeamKRAs(),
    })

    const { data: employees } = useQuery({
        queryKey: ['employees-for-performance'],
        queryFn: () => employeeService.getEmployees({ page_size: 200 })
    })

    const { data: cycles } = useQuery({
        queryKey: ['performance-cycles'],
        queryFn: performanceService.getPerformanceCycles
    })

    const submitMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { manager_rating: number; comments?: string } }) =>
            performanceService.submitManagerRating(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-kras'] })
            toast.success('Rating submitted successfully')
            setSelectedKRA(null)
        },
    })

    const createKraMutation = useMutation({
        mutationFn: () => performanceService.createEmployeeKRA(kraForm),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-kras'] })
            toast.success('Team KRA added')
            setShowKraModal(false)
            setKraError('')
            setKraForm({ employee: '', performance_cycle: '', kra_name: '', kra_description: '', weightage: 10 })
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.detail || err?.message || 'Failed to add KRA'
            setKraError(msg)
            toast.error(msg)
        }
    })

    const createKpiMutation = useMutation({
        mutationFn: () => performanceService.createKPI(kpiForm),
        onSuccess: () => {
            toast.success('Team KPI added')
            setShowKpiModal(false)
            setKpiError('')
            setKpiForm({
                employee: '',
                name: '',
                description: '',
                metric_type: 'numeric' as KPI['metric_type'],
                unit: '',
                target_value: 0,
                period_start: '',
                period_end: ''
            })
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.detail || err?.message || 'Failed to add KPI'
            setKpiError(msg)
            toast.error(msg)
        }
    })

    const createReviewMutation = useMutation({
        mutationFn: () => performanceService.createReview(reviewForm),
        onSuccess: () => {
            toast.success('Review created')
            setShowReviewModal(false)
            setReviewError('')
            setReviewForm({ employee: '', cycle: '', status: 'self_review' })
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.detail || err?.message || 'Failed to create review'
            setReviewError(msg)
            toast.error(msg)
        }
    })

    // Group by employee
    const employeesMap = useMemo(() => {
        if (!teamKRAs) return {}
        const groups: Record<string, EmployeeKRA[]> = {}
        teamKRAs.forEach(kra => {
            if (!groups[kra.employee_id]) {
                groups[kra.employee_id] = []
            }
            groups[kra.employee_id].push(kra)
        })
        return groups
    }, [teamKRAs])

    const employeeIds = Object.keys(employeesMap)

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Team Performance
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Track and rate your team's Key Result Areas
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => { setShowKraModal(true); setKraError('') }}>
                    Add Team KRA
                </button>
                <button className="btn-secondary" onClick={() => { setShowKpiModal(true); setKpiError('') }}>
                    Add Team KPI
                </button>
                <button className="btn-secondary" onClick={() => { setShowReviewModal(true); setReviewError('') }}>
                    Create Review
                </button>
            </div>

            <div className="grid gap-6">
                {employeeIds.length === 0 && (
                    <div className="text-center py-12 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <ChartBarIcon className="w-12 h-12 text-surface-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-surface-900 dark:text-white">No Team Data</h3>
                        <p className="text-surface-500">You don't have any reporting employees with active KRAs.</p>
                    </div>
                )}

                {employeeIds.map(empId => {
                    const kras = employeesMap[empId]
                    const employeeName = kras[0].employee_name

                    return (
                        <div key={empId} className="card overflow-hidden">
                            <div className="bg-surface-50 dark:bg-surface-800 px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
                                <h3 className="tex-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm">
                                        {employeeName.charAt(0)}
                                    </div>
                                    {employeeName}
                                </h3>
                                <span className="text-sm text-surface-500">{kras.length} KRAs</span>
                            </div>

                            <div className="divide-y divide-surface-100 dark:divide-surface-700">
                                {kras.map(kra => (
                                    <div key={kra.id} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-surface-900 dark:text-white">{kra.kra_name}</h4>
                                                    <span className="text-xs bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded text-surface-700 dark:text-surface-300">
                                                        {kra.weightage}%
                                                    </span>
                                                </div>
                                                <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">{kra.kra_description}</p>

                                                {kra.achievement_summary && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-200 mb-2">
                                                        <span className="font-semibold block text-xs uppercase mb-1">Self Assessment:</span>
                                                        "{kra.achievement_summary}"
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                                <div className="text-right">
                                                    <span className="text-xs text-surface-500 block">Self Rating</span>
                                                    <span className="font-bold text-lg">{kra.self_rating || '-'}</span>
                                                </div>

                                                {kra.manager_rating ? (
                                                    <div className="text-right">
                                                        <span className="text-xs text-surface-500 block">Manager Rating</span>
                                                        <span className="font-bold text-lg text-primary-600">{kra.manager_rating}</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedKRA(kra)
                                                            setRating(0)
                                                            setComments('')
                                                        }}
                                                        className="btn-primary text-sm whitespace-nowrap"
                                                    >
                                                        Rate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Rating Modal */}
            <Modal
                isOpen={!!selectedKRA}
                onClose={() => setSelectedKRA(null)}
                title={`Rate: ${selectedKRA?.kra_name}`}
            >
                <div className="space-y-4">
                    <div className="bg-surface-50 dark:bg-surface-800 p-3 rounded">
                        <p className="text-sm font-medium text-surface-900 dark:text-white">Employee: {selectedKRA?.employee_name}</p>
                        {selectedKRA?.self_rating && (
                            <div className="mt-2 flex gap-4 text-sm">
                                <div>
                                    <span className="text-surface-500">Self Rating:</span>
                                    <span className="ml-1 font-bold">{selectedKRA.self_rating}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="form-label">Manager Rating (1-5)</label>
                        <div className="flex space-x-2 mt-2">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRating(r)}
                                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                                    type="button"
                                >
                                    {r <= rating ? (
                                        <StarSolidIcon className="w-8 h-8 text-yellow-400" />
                                    ) : (
                                        <StarIcon className="w-8 h-8 text-surface-300 dark:text-surface-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Feedback / Comments</label>
                        <textarea
                            rows={4}
                            className="form-input w-full"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Provide constructive feedback..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setSelectedKRA(null)} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={() => submitMutation.mutate({
                                id: selectedKRA!.id,
                                data: { manager_rating: rating, comments }
                            })}
                            disabled={!rating || submitMutation.isPending}
                            className="btn-primary"
                        >
                            {submitMutation.isPending ? 'Saving...' : 'Submit Rating'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Team KRA Modal */}
            <Modal
                isOpen={showKraModal}
                onClose={() => { setShowKraModal(false); setKraError('') }}
                title="Add Team KRA"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        setKraError('')
                        createKraMutation.mutate()
                    }}
                    className="space-y-4"
                >
                    {kraError && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{kraError}</div>}
                    <SearchableSelect
                        label="Employee"
                        options={(employees?.results || []).map((e: any) => ({ value: e.id, label: e.full_name || e.user?.full_name || e.employee_id }))}
                        value={kraForm.employee}
                        onChange={(val) => setKraForm(prev => ({ ...prev, employee: val }))}
                        required
                    />
                    <SearchableSelect
                        label="Performance Cycle"
                        options={((cycles as any)?.results || cycles || []).map((c: any) => ({ value: c.id, label: c.name || c.title || `Cycle ${c.year || ''}` }))}
                        value={kraForm.performance_cycle}
                        onChange={(val) => setKraForm(prev => ({ ...prev, performance_cycle: val }))}
                        required
                    />
                    <div>
                        <label className="label">KRA Name</label>
                        <input className="input w-full" value={kraForm.kra_name} onChange={(e) => setKraForm(prev => ({ ...prev, kra_name: e.target.value }))} required />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea className="input w-full" value={kraForm.kra_description} onChange={(e) => setKraForm(prev => ({ ...prev, kra_description: e.target.value }))} rows={3} />
                    </div>
                    <div>
                        <label className="label">Weightage (%)</label>
                        <input type="number" min={1} max={100} className="input w-full" value={kraForm.weightage} onChange={(e) => setKraForm(prev => ({ ...prev, weightage: Number(e.target.value) }))} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" className="btn-secondary" onClick={() => setShowKraModal(false)}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={createKraMutation.isPending}>
                            {createKraMutation.isPending ? 'Saving...' : 'Save KRA'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Add Team KPI Modal */}
            <Modal
                isOpen={showKpiModal}
                onClose={() => { setShowKpiModal(false); setKpiError('') }}
                title="Add Team KPI"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        setKpiError('')
                        createKpiMutation.mutate()
                    }}
                    className="space-y-4"
                >
                    {kpiError && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{kpiError}</div>}
                    <SearchableSelect
                        label="Employee"
                        options={(employees?.results || []).map((e: any) => ({ value: e.id, label: e.full_name || e.user?.full_name || e.employee_id }))}
                        value={kpiForm.employee || ''}
                        onChange={(val) => setKpiForm(prev => ({ ...prev, employee: val }))}
                        required
                    />
                    <div>
                        <label className="label">KPI Name</label>
                        <input className="input w-full" value={kpiForm.name} onChange={(e) => setKpiForm(prev => ({ ...prev, name: e.target.value }))} required />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea className="input w-full" value={kpiForm.description} onChange={(e) => setKpiForm(prev => ({ ...prev, description: e.target.value }))} rows={3} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Metric Type</label>
                            <select className="input w-full" value={kpiForm.metric_type} onChange={(e) => setKpiForm(prev => ({ ...prev, metric_type: e.target.value as KPI['metric_type'] }))}>
                                <option value="numeric">Numeric</option>
                                <option value="percentage">Percentage</option>
                                <option value="currency">Currency</option>
                                <option value="boolean">Boolean</option>
                                <option value="rating">Rating</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Unit</label>
                            <input className="input w-full" value={kpiForm.unit} onChange={(e) => setKpiForm(prev => ({ ...prev, unit: e.target.value }))} placeholder="e.g. % or hours" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Target Value</label>
                            <input type="number" className="input w-full" value={kpiForm.target_value} onChange={(e) => setKpiForm(prev => ({ ...prev, target_value: Number(e.target.value) }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="label">Period Start</label>
                                <input type="date" className="input w-full" value={kpiForm.period_start} onChange={(e) => setKpiForm(prev => ({ ...prev, period_start: e.target.value }))} />
                            </div>
                            <div>
                                <label className="label">Period End</label>
                                <input type="date" className="input w-full" value={kpiForm.period_end} onChange={(e) => setKpiForm(prev => ({ ...prev, period_end: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" className="btn-secondary" onClick={() => setShowKpiModal(false)}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={createKpiMutation.isPending}>
                            {createKpiMutation.isPending ? 'Saving...' : 'Save KPI'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Create Review Modal */}
            <Modal
                isOpen={showReviewModal}
                onClose={() => { setShowReviewModal(false); setReviewError('') }}
                title="Create Performance Review"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        setReviewError('')
                        createReviewMutation.mutate()
                    }}
                    className="space-y-4"
                >
                    {reviewError && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{reviewError}</div>}
                    <SearchableSelect
                        label="Employee"
                        options={(employees?.results || []).map((e: any) => ({ value: e.id, label: e.full_name || e.user?.full_name || e.employee_id }))}
                        value={reviewForm.employee}
                        onChange={(val) => setReviewForm(prev => ({ ...prev, employee: val }))}
                        required
                    />
                    <SearchableSelect
                        label="Cycle"
                        options={((cycles as any)?.results || cycles || []).map((c: any) => ({ value: c.id, label: c.name || c.title || `Cycle ${c.year || ''}` }))}
                        value={reviewForm.cycle}
                        onChange={(val) => setReviewForm(prev => ({ ...prev, cycle: val }))}
                        required
                    />
                    <div>
                        <label className="label">Status</label>
                        <select className="input w-full" value={reviewForm.status} onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}>
                            <option value="self_review">Self Review</option>
                            <option value="manager_review">Manager Review</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" className="btn-secondary" onClick={() => setShowReviewModal(false)}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={createReviewMutation.isPending}>
                            {createReviewMutation.isPending ? 'Saving...' : 'Create Review'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
