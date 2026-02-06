/**
 * Recruitment Service - ATS, Job Postings, Candidates, Interviews
 */

import { api, apiGet, apiPost, apiPatch, apiDelete } from './api'
import { Employee } from './employeeService'

// --- Interfaces ---

export interface Department {
    id: string
    name: string
}

export interface Location {
    id: string
    name: string
}

export interface Designation {
    id: string
    title: string
}

export interface JobPosting {
    id: string
    title: string
    code: string
    department: string | null
    department_details?: Department
    location: string | null
    location_details?: Location
    designation: string | null
    designation_details?: Designation

    description: string
    requirements: string
    responsibilities: string

    employment_type: 'full_time' | 'part_time' | 'contract' | 'intern'
    experience_min: number
    experience_max?: number

    salary_min?: number
    salary_max?: number

    positions: number

    status: 'draft' | 'open' | 'on_hold' | 'closed'

    published_at?: string
    closing_date?: string

    hiring_manager: string | null
    hiring_manager_details?: Employee

    created_at: string
}

export interface Candidate {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string

    resume: string // URL
    parsed_data?: any

    source: 'direct' | 'referral' | 'linkedin' | 'naukri' | 'indeed' | 'other'
    referred_by?: string | null

    total_experience?: number
    current_company?: string
    current_designation?: string
    current_ctc?: number
    expected_ctc?: number
    notice_period?: number

    skills: string[]
    education: any[]

    created_at: string
}

export interface JobApplication {
    id: string
    job: string
    job_details?: JobPosting
    candidate: string
    candidate_details?: Candidate

    stage: 'new' | 'screening' | 'interview' | 'technical' | 'hr' | 'offer' | 'hired' | 'rejected' | 'withdrawn'

    ai_score?: number
    ai_insights?: any

    created_at: string
}

export interface Interview {
    id: string
    application: string
    application_details?: JobApplication

    round_type: 'phone' | 'technical' | 'hr' | 'manager' | 'panel' | 'final'

    scheduled_at: string
    duration_minutes: number

    mode: 'in_person' | 'video' | 'phone'
    meeting_link?: string
    location?: string

    interviewers: string[]
    interviewers_details?: Employee[]

    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'

    feedback?: string
    rating?: number
    recommendation?: 'hire' | 'reject' | 'hold' | 'next_round'
}

// --- Service ---

export const recruitmentService = {
    // --- Job Postings ---
    getJobs: async (params?: any): Promise<JobPosting[]> => {
        const response = await apiGet<any>('/recruitment/jobs/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getJob: async (id: string): Promise<JobPosting> => {
        return apiGet(`/recruitment/jobs/${id}/`)
    },

    createJob: async (data: Partial<JobPosting>): Promise<JobPosting> => {
        return apiPost('/recruitment/jobs/', data)
    },

    updateJob: async (id: string, data: Partial<JobPosting>): Promise<JobPosting> => {
        return apiPatch(`/recruitment/jobs/${id}/`, data)
    },

    deleteJob: async (id: string): Promise<void> => {
        return apiDelete(`/recruitment/jobs/${id}/`)
    },

    // --- Candidates ---
    getCandidates: async (params?: any): Promise<Candidate[]> => {
        const response = await apiGet<any>('/recruitment/candidates/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getCandidate: async (id: string): Promise<Candidate> => {
        return apiGet(`/recruitment/candidates/${id}/`)
    },

    createCandidate: async (data: FormData): Promise<Candidate> => {
        const response = await api.post<Candidate>('/recruitment/candidates/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    },

    // --- Applications ---
    getApplications: async (params?: any): Promise<JobApplication[]> => {
        const response = await apiGet<any>('/recruitment/applications/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    createApplication: async (data: Partial<JobApplication>): Promise<JobApplication> => {
        return apiPost('/recruitment/applications/', data)
    },

    updateApplicationStage: async (id: string, stage: string): Promise<void> => {
        return apiPost(`/recruitment/applications/${id}/change_stage/`, { stage })
    },

    // --- Interviews ---
    getInterviews: async (params?: any): Promise<Interview[]> => {
        const response = await apiGet<any>('/recruitment/interviews/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    createInterview: async (data: Partial<Interview>): Promise<Interview> => {
        return apiPost('/recruitment/interviews/', data)
    },

    updateInterview: async (id: string, data: Partial<Interview>): Promise<Interview> => {
        return apiPatch(`/recruitment/interviews/${id}/`, data)
    }
}
