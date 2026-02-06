/**
 * Interviews Page
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recruitmentService, Interview } from '@/services/recruitmentService'
import { employeeService } from '@/services/employeeService'
import Card, { CardContent } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { PlusIcon, VideoCameraIcon, PhoneIcon, UserGroupIcon, CalendarIcon, ClockIcon, MapPinIcon, LinkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import SearchableSelect from '@/components/ui/SearchableSelect'
import MultiSelect from '@/components/ui/MultiSelect'

const ROUND_TYPES = [
    { value: 'phone', label: 'Phone Screening' },
    { value: 'technical', label: 'Technical Round' },
    { value: 'hr', label: 'HR Round' },
    { value: 'manager', label: 'Hiring Manager Round' },
    { value: 'panel', label: 'Panel Interview' },
    { value: 'final', label: 'Final Round' }
]

const MODES = [
    { value: 'video', label: 'Video Call' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'in_person', label: 'In Person' }
]

const STATUSES = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' }
]

export default function InterviewsPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState<Partial<Interview>>({
        round_type: 'technical',
        mode: 'video',
        duration_minutes: 60,
        interviewers: []
    })

    // --- Queries ---
    const { data: interviews, isLoading } = useQuery({
        queryKey: ['interviews'],
        queryFn: recruitmentService.getInterviews
    })

    const { data: applications } = useQuery({
        queryKey: ['applications'],
        queryFn: recruitmentService.getApplications
    })

    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeService.getEmployees({ page_size: 100 })
    })

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: recruitmentService.createInterview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] })
            setIsModalOpen(false)
            setFormData({ round_type: 'technical', mode: 'video', duration_minutes: 60, interviewers: [] })
            setError('')
            toast.success('Interview scheduled successfully')
        },
        onError: (err: any) => {
            const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to schedule interview'
            setError(errorMsg)
            toast.error(errorMsg)
        }
    })

    // --- Options Preparation ---
    const applicationOptions = useMemo(() => {
        if (!applications) return []
        return applications.map(app => ({
            value: app.id,
            label: `${app.candidate_details?.first_name} ${app.candidate_details?.last_name}`,
            subtext: `${app.job_details?.title} - ${app.stage}`
        }))
    }, [applications])

    const employeeOptions = useMemo(() => {
        if (!employees?.results) return []
        return employees.results.map((e: any) => {
            const displayName = e.full_name ||
                e.user?.full_name ||
                (e.user?.first_name ? `${e.user.first_name} ${e.user.last_name || ''}` : '') ||
                e.email ||
                e.user?.email ||
                e.employee_id;

            const label = (e.employee_id && displayName !== e.employee_id)
                ? `${displayName} (${e.employee_id})`
                : displayName || 'Unknown';

            return {
                value: e.id,
                label: label,
                subtext: e.designation?.name
            }
        })
    }, [employees])

    // --- Handlers ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        createMutation.mutate(formData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Interviews</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    Schedule Interview
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {interviews?.map((interview) => (
                    <Card key={interview.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary-500">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                                        {interview.application_details?.candidate_details?.first_name} {interview.application_details?.candidate_details?.last_name}
                                    </h3>
                                    <p className="text-surface-500 text-sm">{interview.application_details?.job_details?.title}</p>
                                </div>
                                <div className={`p-2 rounded-full ${interview.mode === 'video' ? 'bg-blue-100 text-blue-600' :
                                    interview.mode === 'phone' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                                    }`}>
                                    {interview.mode === 'video' && <VideoCameraIcon className="w-5 h-5" />}
                                    {interview.mode === 'phone' && <PhoneIcon className="w-5 h-5" />}
                                    {interview.mode === 'in_person' && <UserGroupIcon className="w-5 h-5" />}
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center text-surface-600 dark:text-surface-400">
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    <span>{format(new Date(interview.scheduled_at), 'PP p')}</span>
                                </div>

                                <div className="flex items-center text-surface-600 dark:text-surface-400">
                                    <ClockIcon className="w-4 h-4 mr-2" />
                                    <span>{interview.duration_minutes} mins</span>
                                </div>

                                <div className="flex items-center text-surface-600 dark:text-surface-400">
                                    <span className="font-semibold mr-2 w-4">Rd:</span>
                                    <span className="capitalize">{interview.round_type.replace('_', ' ')}</span>
                                </div>

                                {interview.mode === 'video' && interview.meeting_link && (
                                    <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="flex items-center text-primary-600 hover:text-primary-700">
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        Join Meeting
                                    </a>
                                )}

                                {interview.mode === 'in_person' && interview.location && (
                                    <div className="flex items-center text-surface-600 dark:text-surface-400">
                                        <MapPinIcon className="w-4 h-4 mr-2" />
                                        <span>{interview.location}</span>
                                    </div>
                                )}

                                {interview.interviewers_details && interview.interviewers_details.length > 0 && (
                                    <div className="pt-2 border-t border-surface-100 dark:border-surface-700">
                                        <p className="text-xs text-surface-500 mb-1">Interviewers:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {interview.interviewers_details.map(emp => (
                                                <span key={emp.id} className="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                                                    {emp.user?.first_name || emp.full_name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                    interview.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {interview.status}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Schedule Interview Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setError('')
                }}
                title="Schedule Interview"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="h-full flex flex-col">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto pr-2 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Application Search */}
                        <div className="md:col-span-2">
                            <SearchableSelect
                                label="Candidate / Application"
                                options={applicationOptions}
                                value={formData.application || ''}
                                onChange={(val) => setFormData(prev => ({ ...prev, application: val }))}
                                placeholder="Search candidate..."
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Round Type</label>
                            <select
                                name="round_type"
                                value={formData.round_type}
                                onChange={handleChange}
                                className="input w-full"
                                required
                            >
                                {ROUND_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Mode</label>
                            <select
                                name="mode"
                                value={formData.mode}
                                onChange={handleChange}
                                className="input w-full"
                                required
                            >
                                {MODES.map(mode => (
                                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Date & Time</label>
                            <input
                                type="datetime-local"
                                name="scheduled_at"
                                value={formData.scheduled_at || ''}
                                onChange={handleChange}
                                className="input w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Duration (Minutes)</label>
                            <input
                                type="number"
                                name="duration_minutes"
                                value={formData.duration_minutes}
                                onChange={handleChange}
                                className="input w-full"
                                min="15"
                                step="15"
                                required
                            />
                        </div>

                        {formData.mode === 'video' && (
                            <div className="md:col-span-2">
                                <label className="label">Meeting Link</label>
                                <input
                                    type="url"
                                    name="meeting_link"
                                    value={formData.meeting_link || ''}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>
                        )}

                        {formData.mode === 'in_person' && (
                            <div className="md:col-span-2">
                                <label className="label">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location || ''}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="Conference Room A"
                                />
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <MultiSelect
                                label="Interviewers"
                                options={employeeOptions}
                                value={formData.interviewers || []}
                                onChange={(vals) => setFormData(prev => ({ ...prev, interviewers: vals }))}
                                placeholder="Select Interviewers..."
                            />
                        </div>
                    </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700 mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false)
                                setError('')
                            }}
                            className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {createMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
