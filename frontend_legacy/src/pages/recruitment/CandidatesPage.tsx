/**
 * Candidates Page
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recruitmentService } from '@/services/recruitmentService'
import { employeeService } from '@/services/employeeService'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

export default function CandidatesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { data: candidates, isLoading } = useQuery({
        queryKey: ['candidates'],
        queryFn: recruitmentService.getCandidates
    })

    const handleClose = () => {
        setIsModalOpen(false)
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Candidates</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary flex items-center"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Candidate
                </button>
            </div>

            <div className="bg-white dark:bg-surface-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                    <thead className="bg-surface-50 dark:bg-surface-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Candidate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Experience</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">Resume</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                        {candidates?.map((candidate) => (
                            <tr key={candidate.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-surface-900 dark:text-white">
                                        {candidate.first_name} {candidate.last_name}
                                    </div>
                                    <div className="text-sm text-surface-500">{candidate.current_designation}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-surface-900 dark:text-white">{candidate.email}</div>
                                    <div className="text-sm text-surface-500">{candidate.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                                    {candidate.total_experience} Years
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                        {candidate.source}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                                    {candidate.resume && (
                                        <a href={candidate.resume} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-900">
                                            <DocumentTextIcon className="w-5 h-5" />
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleClose} title="Add Candidate" size="lg">
                <CandidateForm onClose={handleClose} />
            </Modal>
        </div>
    )
}

import SearchableSelect from '@/components/ui/SearchableSelect'

function CandidateForm({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient()
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: 'direct',
        referred_by: '',
        total_experience: 0,
        current_company: '',
        current_designation: '',
        current_ctc: 0,
        expected_ctc: 0,
        notice_period: 0,
        skills: '',
        education: '',
    })

    // Fetch employees for referral dropdown
    const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: () => employeeService.getEmployees() })

    // Prepare employee options
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
                subtext: e.designation?.name // Don't show ID in subtext to avoid duplication
            }
        })
    }, [employees])

    const mutation = useMutation({
        mutationFn: (data: FormData) => recruitmentService.createCandidate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates'] })
            toast.success('Candidate added successfully')
            onClose()
        },
        onError: (err: any) => {
            const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to add candidate'
            setError(errorMsg)
            toast.error(errorMsg)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        const data = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'skills') {
                const skillsArray = (value as string).split(',').map(s => s.trim()).filter(s => s)
                skillsArray.forEach(skill => data.append('skills', skill))
            } else if (key === 'education') {
                data.append(key, String(value))
            } else {
                data.append(key, String(value))
            }
        })
        if (file) {
            data.append('resume', file)
        }
        mutation.mutate(data)
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
            
            <div className="flex-1 space-y-5 overflow-y-auto pr-2 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="label">First Name <span className="text-red-500">*</span></label>
                        <input className="input w-full" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="e.g. John" />
                    </div>
                    <div>
                        <label className="label">Last Name <span className="text-red-500">*</span></label>
                        <input className="input w-full" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="e.g. Doe" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="label">Email <span className="text-red-500">*</span></label>
                        <input type="email" className="input w-full" name="email" value={formData.email} onChange={handleChange} required placeholder="john.doe@example.com" />
                    </div>
                    <div>
                        <label className="label">Phone</label>
                        <input className="input w-full" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 8900" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="label">Source</label>
                        <select className="input w-full" name="source" value={formData.source} onChange={handleChange}>
                            <option value="direct">Direct</option>
                            <option value="referral">Referral</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="naukri">Naukri</option>
                            <option value="indeed">Indeed</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <SearchableSelect
                            label="Referred By"
                            options={employeeOptions}
                            value={formData.referred_by}
                            onChange={(val) => setFormData(prev => ({ ...prev, referred_by: val }))}
                            placeholder="Search employee..."
                            disabled={formData.source !== 'referral'}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="label">Total Experience (Yrs)</label>
                        <input type="number" className="input w-full" name="total_experience" value={formData.total_experience} onChange={handleChange} min={0} step={0.1} />
                    </div>
                    <div>
                        <label className="label">Notice Period (Days)</label>
                        <input type="number" className="input w-full" name="notice_period" value={formData.notice_period} onChange={handleChange} min={0} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="label">Current Company</label>
                        <input className="input w-full" name="current_company" value={formData.current_company} onChange={handleChange} placeholder="e.g. Acme Corp" />
                    </div>
                    <div>
                        <label className="label">Current Designation</label>
                        <input className="input w-full" name="current_designation" value={formData.current_designation} onChange={handleChange} placeholder="e.g. Software Engineer" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="label">Current CTC (LPA)</label>
                        <input type="number" className="input w-full" name="current_ctc" value={formData.current_ctc} onChange={handleChange} min={0} placeholder="e.g. 12" />
                    </div>
                    <div>
                        <label className="label">Expected CTC (LPA)</label>
                        <input type="number" className="input w-full" name="expected_ctc" value={formData.expected_ctc} onChange={handleChange} min={0} placeholder="e.g. 15" />
                    </div>
                </div>

                <div>
                    <label className="label">Skills (comma separated)</label>
                    <input className="input w-full" name="skills" value={formData.skills} onChange={handleChange} placeholder="Java, React, Python, AWS..." />
                </div>

                <div>
                    <label className="label">Education</label>
                    <textarea
                        className="input w-full min-h-[80px]"
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        placeholder="e.g. B.Tech in Computer Science, University of Technology, 2020"
                    />
                </div>

                <div>
                    <label className="label">Resume <span className="text-red-500">*</span></label>
                    <input type="file" className="input w-full pt-1.5" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-surface-200 dark:border-surface-700 mt-2">
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
                    {mutation.isPending ? 'Saving...' : 'Save Candidate'}
                </button>
            </div>
        </form>
    )
}
