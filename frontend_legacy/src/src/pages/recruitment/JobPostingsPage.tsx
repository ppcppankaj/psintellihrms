/**
 * Job Postings Page
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recruitmentService, JobPosting } from '@/services/recruitmentService'
import { employeeService } from '@/services/employeeService'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

export default function JobPostingsPage() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingJob, setEditingJob] = useState<JobPosting | null>(null)

    const { data: jobs, isLoading } = useQuery({
        queryKey: ['jobs'],
        queryFn: recruitmentService.getJobs
    })

    const deleteMutation = useMutation({
        mutationFn: recruitmentService.deleteJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
            toast.success('Job posting deleted')
        }
    })

    const handleEdit = (job: JobPosting) => {
        setEditingJob(job)
        setIsModalOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this job posting?')) {
            deleteMutation.mutate(id)
        }
    }

    const handleClose = () => {
        setIsModalOpen(false)
        setEditingJob(null)
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Job Postings</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary flex items-center"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Job
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.isArray(jobs) && jobs.map((job) => (
                    <Card key={job.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader
                            title={job.title}
                            action={
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(job)} className="text-surface-500 hover:text-primary-600">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(job.id)} className="text-surface-500 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            }
                        />
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <p className="text-surface-500 line-clamp-2">{job.description}</p>
                                <div className="flex justify-between">
                                    <span className="font-semibold">Code:</span>
                                    <span>{job.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold">Department:</span>
                                    <span>{job.department_details?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold">Location:</span>
                                    <span>{job.location_details?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold">Status:</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs uppercase font-bold 
                                        ${job.status === 'open' ? 'bg-green-100 text-green-800' :
                                            job.status === 'closed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {job.status}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleClose} title={editingJob ? 'Edit Job' : 'Create Job'} size="lg">
                <JobForm job={editingJob} onClose={handleClose} />
            </Modal>
        </div>
    )
}

function JobForm({ job, onClose }: { job: JobPosting | null, onClose: () => void }) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState<Partial<JobPosting>>(job || {
        title: '',
        code: '',
        department: '',
        location: '',
        designation: '',
        positions: 1,
        status: 'draft',
        employment_type: 'full_time',
        description: '',
        requirements: '',
        responsibilities: '',
        experience_min: 0,
        experience_max: 0,
        hiring_manager: '',
    })
    const [error, setError] = useState('')

    // Fetch master data
    const { data: departments, isLoading: loadingDepts } = useQuery({ queryKey: ['departments'], queryFn: () => employeeService.getDepartments() })
    const { data: locations, isLoading: loadingLocs } = useQuery({ queryKey: ['locations'], queryFn: () => employeeService.getLocations() })
    const { data: designations, isLoading: loadingDesigs } = useQuery({ queryKey: ['designations'], queryFn: () => employeeService.getDesignations() })
    const { data: employees, isLoading: loadingEmps } = useQuery({ queryKey: ['employees'], queryFn: () => employeeService.getEmployees() })

    const mutation = useMutation({
        mutationFn: (data: Partial<JobPosting>) =>
            job ? recruitmentService.updateJob(job.id, data) : recruitmentService.createJob(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
            toast.success(job ? 'Job updated successfully' : 'Job created successfully')
            onClose()
        },
        onError: (err: any) => {
            const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to save job posting'
            setError(errorMsg)
            toast.error(errorMsg)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        mutation.mutate(formData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2 pb-4">
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="label">Job Title <span className="text-red-500">*</span></label>
                            <input className="input w-full" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Senior Software Engineer" />
                        </div>
                        <div>
                            <label className="label">Job Code <span className="text-red-500">*</span></label>
                            <input className="input w-full" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. ENG-2024-001" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="label">Department</label>
                            <select className="input w-full" name="department" value={formData.department || ''} onChange={handleChange} disabled={loadingDepts}>
                                <option value="">Select Department</option>
                                {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Location</label>
                            <select className="input w-full" name="location" value={formData.location || ''} onChange={handleChange} disabled={loadingLocs}>
                                <option value="">Select Location</option>
                                {locations?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="label">Designation</label>
                            <select className="input w-full" name="designation" value={formData.designation || ''} onChange={handleChange} disabled={loadingDesigs}>
                                <option value="">Select Designation</option>
                                {designations?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Hiring Manager</label>
                            <select className="input w-full" name="hiring_manager" value={formData.hiring_manager || ''} onChange={handleChange} disabled={loadingEmps}>
                                <option value="">Select Manager</option>
                                {employees?.results?.map((e: any) => {
                            const displayName = e.full_name ||
                                e.user?.full_name ||
                                (e.user?.first_name ? `${e.user.first_name} ${e.user.last_name || ''}` : '') ||
                                e.email ||
                                e.user?.email ||
                                e.employee_id;

                            const label = (e.employee_id && displayName !== e.employee_id)
                                ? `${displayName} (${e.employee_id})`
                                : displayName || 'Unknown';

                            return (
                                <option key={e.id} value={e.id}>
                                    {label}
                                </option>
                            )
                        })}
                    </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="label">Job Status</label>
                            <select className="input w-full" name="status" value={formData.status} onChange={handleChange}>
                                <option value="draft">Draft</option>
                                <option value="open">Open</option>
                                <option value="on_hold">On Hold</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Employment Type</label>
                            <select className="input w-full" name="employment_type" value={formData.employment_type} onChange={handleChange}>
                                <option value="full_time">Full Time</option>
                                <option value="part_time">Part Time</option>
                                <option value="contract">Contract</option>
                                <option value="intern">Intern</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="label">Open Positions</label>
                            <input type="number" className="input w-full" name="positions" value={formData.positions} onChange={handleChange} min={1} />
                        </div>
                        <div>
                            <label className="label">Min Experience (Yrs)</label>
                            <input type="number" className="input w-full" name="experience_min" value={formData.experience_min} onChange={handleChange} min={0} />
                        </div>
                        <div>
                            <label className="label">Max Experience (Yrs)</label>
                            <input type="number" className="input w-full" name="experience_max" value={formData.experience_max} onChange={handleChange} min={0} />
                        </div>
                    </div>

                    <div>
                        <label className="label mb-2 block">Job Description</label>
                        <textarea
                            className="input w-full min-h-[100px]"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter a detailed job description..."
                        ></textarea>
                    </div>
                    <div>
                        <label className="label mb-2 block">Requirements</label>
                        <textarea
                            className="input w-full min-h-[100px]"
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            placeholder="- Bachelor's degree in Computer Science&#10;- 5+ years of experience..."
                        ></textarea>
                    </div>
                    <div>
                        <label className="label mb-2 block">Responsibilities</label>
                        <textarea
                            className="input w-full min-h-[100px]"
                            name="responsibilities"
                            value={formData.responsibilities}
                            onChange={handleChange}
                            placeholder="- Lead the development team&#10;- Conduct code reviews..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-surface-200 dark:border-surface-700 mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
                </button>
            </div>
        </form>
    )
}
