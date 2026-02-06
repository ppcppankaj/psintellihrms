/**
 * Performance KRA Page - View and rate KRAs and KPIs
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ChartBarIcon,
    AcademicCapIcon,
    ArrowTrendingUpIcon,
    StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { performanceService, EmployeeKRA, KPI, EmployeeCompetency } from '@/services/performanceService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function PerformanceKRAPage() {
    const [activeTab, setActiveTab] = useState<'kras' | 'kpis' | 'competencies'>('kras')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Performance Management
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Track your KRAs, KPIs, and competencies
                </p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg w-fit">
                {[
                    { id: 'kras', label: 'My KRAs', icon: ChartBarIcon },
                    { id: 'kpis', label: 'My KPIs', icon: ArrowTrendingUpIcon },
                    { id: 'competencies', label: 'Competencies', icon: AcademicCapIcon },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow'
                                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'kras' && <KRAsTab />}
            {activeTab === 'kpis' && <KPIsTab />}
            {activeTab === 'competencies' && <CompetenciesTab />}
        </div>
    )
}

function KRAsTab() {
    const queryClient = useQueryClient()

    const { data: kras, isLoading } = useQuery({
        queryKey: ['my-kras'],
        queryFn: () => performanceService.getMyKRAs(),
    })

    const [selectedKRA, setSelectedKRA] = useState<EmployeeKRA | null>(null)
    const [selfRating, setSelfRating] = useState(0)
    const [notes, setNotes] = useState('')

    const submitMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { self_rating: number; achievement_summary: string } }) =>
            performanceService.submitSelfRating(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-kras'] })
            toast.success('Self rating submitted successfully')
            setSelectedKRA(null)
        },
        onError: (err: any) => {
            const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to submit rating'
            toast.error(errorMsg)
        }
    })

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    return (
        <>
            <div className="grid gap-4">
                {kras?.map((kra) => (
                    <motion.div
                        key={kra.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                    <h3 className="font-semibold text-surface-900 dark:text-white">
                                        {kra.kra_name}
                                    </h3>
                                    <span className="badge badge-info">{kra.weightage}%</span>
                                </div>
                                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                    {kra.kra_description}
                                </p>
                                <p className="text-xs text-surface-500 mt-2">
                                    Cycle: {kra.cycle_name}
                                </p>
                            </div>
                            <div className="text-right ml-4">
                                {kra.final_rating ? (
                                    <div>
                                        <p className="text-2xl font-bold text-primary-600">{kra.final_rating}</p>
                                        <p className="text-xs text-surface-500">Final Rating</p>
                                    </div>
                                ) : kra.self_rating ? (
                                    <div>
                                        <p className="text-xl font-bold text-surface-600">{kra.self_rating}</p>
                                        <p className="text-xs text-surface-500">Self Rated</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedKRA(kra)
                                            setSelfRating(0)
                                            setNotes('')
                                        }}
                                        className="btn-primary text-sm"
                                    >
                                        Rate Yourself
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
                {(!kras || kras.length === 0) && (
                    <div className="text-center py-8 text-surface-500">
                        No KRAs assigned for the current cycle
                    </div>
                )}
            </div>

            {/* Self Rating Modal */}
            {selectedKRA && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md glass-card p-6"
                    >
                        <h3 className="text-lg font-semibold mb-4">Rate: {selectedKRA.kra_name}</h3>

                        <div className="mb-5">
                            <label className="label">Your Rating (1-5) <span className="text-red-500">*</span></label>
                            <div className="flex space-x-2 mt-3">
                                {[1, 2, 3, 4, 5].map((r) => (
                                    <button
                                        type="button"
                                        key={r}
                                        onClick={() => setSelfRating(r)}
                                        className="p-1 hover:scale-110 transition-transform"
                                    >
                                        {r <= selfRating ? (
                                            <StarSolidIcon className="w-10 h-10 text-yellow-400" />
                                        ) : (
                                            <StarIcon className="w-10 h-10 text-surface-300 dark:text-surface-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="label">Achievement Summary</label>
                            <textarea
                                rows={4}
                                className="input w-full"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Describe your key achievements and contributions..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                            <button onClick={() => setSelectedKRA(null)} className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => submitMutation.mutate({
                                    id: selectedKRA.id,
                                    data: { self_rating: selfRating, achievement_summary: notes }
                                })}
                                disabled={!selfRating || submitMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    )
}

function KPIsTab() {
    const queryClient = useQueryClient()

    const { data: kpis, isLoading } = useQuery({
        queryKey: ['my-kpis'],
        queryFn: () => performanceService.getMyKPIs(),
    })

    const statusColors: Record<string, string> = {
        achieved: 'badge-success',
        exceeded: 'bg-emerald-100 text-emerald-700',
        on_track: 'badge-info',
        at_risk: 'badge-warning',
        behind: 'badge-error',
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    return (
        <div className="grid gap-4">
            {kpis?.map((kpi) => (
                <motion.div
                    key={kpi.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-semibold text-surface-900 dark:text-white">{kpi.name}</h3>
                            <p className="text-sm text-surface-500">{kpi.description}</p>
                        </div>
                        <span className={`badge ${statusColors[kpi.status]}`}>
                            {kpi.status_display}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div className="p-2 rounded bg-surface-50 dark:bg-surface-800">
                            <p className="text-xs text-surface-500">Target</p>
                            <p className="font-bold text-surface-900 dark:text-white">
                                {kpi.target_value}{kpi.unit || ''}
                            </p>
                        </div>
                        <div className="p-2 rounded bg-surface-50 dark:bg-surface-800">
                            <p className="text-xs text-surface-500">Current</p>
                            <p className="font-bold text-primary-600">
                                {kpi.current_value}{kpi.unit || ''}
                            </p>
                        </div>
                        <div className="p-2 rounded bg-surface-50 dark:bg-surface-800">
                            <p className="text-xs text-surface-500">Achievement</p>
                            <p className={`font-bold ${kpi.achievement_percentage >= 100 ? 'text-green-600' : 'text-surface-900'}`}>
                                {kpi.achievement_percentage}%
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${kpi.achievement_percentage >= 100 ? 'bg-green-500' :
                                    kpi.achievement_percentage >= 75 ? 'bg-primary-500' :
                                        kpi.achievement_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${Math.min(kpi.achievement_percentage, 100)}%` }}
                        />
                    </div>
                </motion.div>
            ))}
            {(!kpis || kpis.length === 0) && (
                <div className="text-center py-8 text-surface-500">
                    No KPIs assigned
                </div>
            )}
        </div>
    )
}

function CompetenciesTab() {
    const { data: competencies, isLoading } = useQuery({
        queryKey: ['my-competencies'],
        queryFn: () => performanceService.getMyCompetencies(),
    })

    if (isLoading) {
        return <div className="flex justify-center p-8"><LoadingSpinner /></div>
    }

    return (
        <div className="grid gap-4">
            {competencies?.map((comp) => (
                <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-4"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-surface-900 dark:text-white">
                                    {comp.competency_name}
                                </h3>
                                <span className="text-xs px-2 py-0.5 rounded bg-surface-100 text-surface-600">
                                    {comp.competency_category}
                                </span>
                            </div>
                            <p className="text-sm text-surface-500 mt-1">
                                Required: Level {comp.required_level}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <p className="text-xs text-surface-500">Self</p>
                                    <p className="text-lg font-bold">{comp.self_assessment || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-surface-500">Manager</p>
                                    <p className="text-lg font-bold">{comp.manager_assessment || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-surface-500">Final</p>
                                    <p className="text-lg font-bold text-primary-600">{comp.final_level || '-'}</p>
                                </div>
                            </div>
                            {comp.gap !== 0 && (
                                <p className={`text-xs mt-1 ${comp.gap > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    Gap: {comp.gap > 0 ? `-${comp.gap}` : `+${Math.abs(comp.gap)}`}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
            {(!competencies || competencies.length === 0) && (
                <div className="text-center py-8 text-surface-500">
                    No competencies assigned
                </div>
            )}
        </div>
    )
}
