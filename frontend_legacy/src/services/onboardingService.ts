/**
 * Onboarding Service - Onboarding API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api'

// Types
export interface OnboardingTemplate {
    id: string
    name: string
    code: string
    description: string
    department?: string
    department_name?: string
    designation?: string
    designation_name?: string
    days_before_joining: number
    days_to_complete: number
    is_default: boolean
    is_active: boolean
    task_count?: number
}

export interface OnboardingTaskTemplate {
    id: string
    template: string
    title: string
    description: string
    stage: 'pre_joining' | 'day_one' | 'first_week' | 'first_month' | 'post_onboarding'
    assigned_to_type: 'employee' | 'hr' | 'manager' | 'it' | 'admin' | 'finance'
    due_days_offset: number
    is_mandatory: boolean
    requires_attachment: boolean
    requires_acknowledgement: boolean
    order: number
}

export interface EmployeeOnboarding {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    template: string
    template_name: string
    joining_date: string
    start_date: string
    target_completion_date: string
    actual_completion_date?: string
    status: 'not_started' | 'in_progress' | 'completed' | 'cancelled'
    total_tasks: number
    completed_tasks: number
    progress_percentage: number
    hr_responsible?: string
    hr_responsible_name?: string
    buddy?: string
    buddy_name?: string
}

export interface OnboardingTask {
    id: string
    onboarding: string
    title: string
    description: string
    stage: string
    stage_display: string
    is_mandatory: boolean
    assigned_to?: string
    assigned_to_name?: string
    due_date: string
    status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue'
    status_display: string
    completed_at?: string
    completed_by_name?: string
    notes?: string
    attachment?: string
    acknowledged: boolean
}

export interface OnboardingDocument {
    id: string
    onboarding: string
    document_type: string
    document_type_display: string
    document_name: string
    file: string
    is_mandatory: boolean
    status: 'pending' | 'uploaded' | 'verified' | 'rejected'
    status_display: string
    verified_by_name?: string
    verified_at?: string
    rejection_reason?: string
}

export interface InitiateOnboardingData {
    employee_id: string
    template_id?: string
    joining_date: string
    hr_responsible_id?: string
    buddy_id?: string
}

export interface OnboardingSummary {
    total_onboardings: number
    not_started: number
    in_progress: number
    completed: number
    overdue: number
    average_completion_days: number
}

export const onboardingService = {
    // Templates
    getTemplates: async (active_only = true): Promise<OnboardingTemplate[]> => {
        const params: Record<string, string> = { is_active: String(active_only) }
        return apiGet('/onboarding/templates/', params)
    },

    getTemplate: async (id: string): Promise<OnboardingTemplate> => {
        return apiGet(`/onboarding/templates/${id}/`)
    },

    createTemplate: async (data: Partial<OnboardingTemplate>): Promise<OnboardingTemplate> => {
        return apiPost('/onboarding/templates/', data)
    },

    updateTemplate: async (id: string, data: Partial<OnboardingTemplate>): Promise<OnboardingTemplate> => {
        return apiPut(`/onboarding/templates/${id}/`, data)
    },

    deleteTemplate: async (id: string): Promise<void> => {
        return apiDelete(`/onboarding/templates/${id}/`)
    },

    // Task Templates
    getTaskTemplates: async (templateId: string): Promise<OnboardingTaskTemplate[]> => {
        return apiGet('/onboarding/task-templates/', { template: templateId })
    },

    createTaskTemplate: async (data: Partial<OnboardingTaskTemplate>): Promise<OnboardingTaskTemplate> => {
        return apiPost('/onboarding/task-templates/', data)
    },

    updateTaskTemplate: async (id: string, data: Partial<OnboardingTaskTemplate>): Promise<OnboardingTaskTemplate> => {
        return apiPut(`/onboarding/task-templates/${id}/`, data)
    },

    deleteTaskTemplate: async (id: string): Promise<void> => {
        return apiDelete(`/onboarding/task-templates/${id}/`)
    },

    // Employee Onboardings
    getOnboardings: async (filters?: {
        status?: string
        employee_id?: string
    }): Promise<EmployeeOnboarding[]> => {
        const params: Record<string, string> = {}
        if (filters?.status) params.status = filters.status
        if (filters?.employee_id) params.employee = filters.employee_id
        return apiGet('/onboarding/onboardings/', params)
    },

    getOnboarding: async (id: string): Promise<EmployeeOnboarding> => {
        return apiGet(`/onboarding/onboardings/${id}/`)
    },

    initiateOnboarding: async (data: InitiateOnboardingData): Promise<{ success: boolean; data: EmployeeOnboarding }> => {
        return apiPost('/onboarding/onboardings/initiate/', data)
    },

    getMyOnboarding: async (): Promise<EmployeeOnboarding | null> => {
        try {
            return apiGet('/onboarding/onboardings/my_onboarding/')
        } catch {
            return null
        }
    },

    getOnboardingSummary: async (): Promise<OnboardingSummary> => {
        return apiGet('/onboarding/onboardings/summary/')
    },

    // Tasks
    getTasks: async (onboardingId: string): Promise<OnboardingTask[]> => {
        return apiGet('/onboarding/tasks/', { onboarding: onboardingId })
    },

    getMyTasks: async (): Promise<OnboardingTask[]> => {
        return apiGet('/onboarding/tasks/my_tasks/')
    },

    getPendingTasks: async (): Promise<OnboardingTask[]> => {
        return apiGet('/onboarding/tasks/pending/')
    },

    completeTask: async (taskId: string, data: {
        notes?: string
        attachment?: File
        acknowledged?: boolean
    }): Promise<OnboardingTask> => {
        const formData = new FormData()
        if (data.notes) formData.append('notes', data.notes)
        if (data.attachment) formData.append('attachment', data.attachment)
        if (data.acknowledged !== undefined) formData.append('acknowledged', String(data.acknowledged))
        return apiPost(`/onboarding/tasks/${taskId}/complete/`, formData)
    },

    skipTask: async (taskId: string, reason: string): Promise<OnboardingTask> => {
        return apiPost(`/onboarding/tasks/${taskId}/skip/`, { reason })
    },

    // Documents
    getDocuments: async (onboardingId: string): Promise<OnboardingDocument[]> => {
        return apiGet('/onboarding/documents/', { onboarding: onboardingId })
    },

    uploadDocument: async (onboardingId: string, data: {
        document_type: string
        document_name: string
        file: File
    }): Promise<OnboardingDocument> => {
        const formData = new FormData()
        formData.append('onboarding', onboardingId)
        formData.append('document_type', data.document_type)
        formData.append('document_name', data.document_name)
        formData.append('file', data.file)
        return apiPost('/onboarding/documents/', formData)
    },

    verifyDocument: async (docId: string, data: {
        action: 'verify' | 'reject'
        rejection_reason?: string
    }): Promise<OnboardingDocument> => {
        return apiPost(`/onboarding/documents/${docId}/verify/`, data)
    },
}
