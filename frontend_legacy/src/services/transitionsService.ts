/**
 * Transitions Service - Employee Transfers, Promotions, Resignations API
 */

import { apiGet, apiPost, apiPut } from './api'

// Employee Transfer
export interface EmployeeTransfer {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    transfer_type: 'department' | 'location' | 'manager' | 'combined'
    transfer_type_display: string
    from_department_name?: string
    to_department_name?: string
    from_location_name?: string
    to_location_name?: string
    from_manager_name?: string
    to_manager_name?: string
    requested_date: string
    effective_date: string
    reason: string
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
    status_display: string
    approved_by_name?: string
    approved_at?: string
    rejection_reason?: string
}

export interface CreateTransferData {
    employee_id: string
    transfer_type: string
    to_department_id?: string
    to_location_id?: string
    to_manager_id?: string
    effective_date: string
    reason: string
}

// Employee Promotion
export interface EmployeePromotion {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    from_designation_name: string
    to_designation_name: string
    current_ctc?: number
    new_ctc?: number
    increment_percentage?: number
    requested_date: string
    effective_date: string
    reason: string
    achievements?: string
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
    status_display: string
    recommended_by_name?: string
    approved_by_name?: string
    approved_at?: string
    rejection_reason?: string
}

export interface CreatePromotionData {
    employee_id: string
    to_designation_id: string
    new_ctc?: number
    effective_date: string
    reason: string
    achievements?: string
}

// Resignation
export interface ResignationRequest {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    resignation_date: string
    requested_last_working_date: string
    approved_last_working_date?: string
    notice_period_days: number
    notice_period_waived: number
    shortfall_recovery: boolean
    primary_reason: string
    primary_reason_display: string
    detailed_reason?: string
    new_employer?: string
    status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'withdrawn' | 'completed'
    status_display: string
    accepted_by_name?: string
    accepted_at?: string
    exit_checklist_complete: boolean
    fnf_processed: boolean
}

export interface CreateResignationData {
    resignation_date: string
    requested_last_working_date: string
    primary_reason: string
    detailed_reason?: string
    new_employer?: string
}

// Exit Interview
export interface ExitInterview {
    id: string
    resignation: string
    employee_name: string
    interview_date: string
    interviewer_name?: string
    job_satisfaction?: number
    work_life_balance?: number
    management_support?: number
    growth_opportunities?: number
    compensation_satisfaction?: number
    work_environment?: number
    team_collaboration?: number
    average_rating?: number
    reason_for_leaving: string
    liked_most?: string
    improvements_suggested?: string
    would_recommend?: boolean
    would_return?: boolean
    is_completed: boolean
}

export interface ExitInterviewFormData {
    interview_date: string
    job_satisfaction: number
    work_life_balance: number
    management_support: number
    growth_opportunities: number
    compensation_satisfaction: number
    work_environment: number
    team_collaboration: number
    reason_for_leaving: string
    liked_most?: string
    improvements_suggested?: string
    would_recommend?: boolean
    would_return?: boolean
}

export const transitionsService = {
    // Transfers
    getTransfers: async (filters?: { status?: string; employee_id?: string }): Promise<EmployeeTransfer[]> => {
        const params: Record<string, string> = {}
        if (filters?.status) params.status = filters.status
        if (filters?.employee_id) params.employee = filters.employee_id
        const res = await apiGet('/employees/transfers/', params)
        return extractArray(res)
    },

    getTransfer: async (id: string): Promise<EmployeeTransfer> => {
        return apiGet(`/employees/transfers/${id}/`)
    },

    createTransfer: async (data: CreateTransferData): Promise<EmployeeTransfer> => {
        return apiPost('/employees/transfers/', data)
    },

    updateTransfer: async (id: string, data: Partial<CreateTransferData>): Promise<EmployeeTransfer> => {
        return apiPut(`/employees/transfers/${id}/`, data)
    },

    deleteTransfer: async (id: string): Promise<void> => {
        const { api } = await import('./api')
        await api.delete(`/employees/transfers/${id}/`)
    },

    submitTransfer: async (id: string): Promise<EmployeeTransfer> => {
        return apiPost(`/employees/transfers/${id}/submit/`)
    },

    approveTransfer: async (id: string, data: { action: 'approve' | 'reject'; comments?: string }): Promise<EmployeeTransfer> => {
        return apiPost(`/employees/transfers/${id}/approve/`, data)
    },


    // Promotions
    getPromotions: async (filters?: { status?: string; employee_id?: string }): Promise<EmployeePromotion[]> => {
        const params: Record<string, string> = {}
        if (filters?.status) params.status = filters.status
        if (filters?.employee_id) params.employee = filters.employee_id
        const res = await apiGet('/employees/promotions/', params)
        return extractArray(res)
    },

    getPromotion: async (id: string): Promise<EmployeePromotion> => {
        return apiGet(`/employees/promotions/${id}/`)
    },

    createPromotion: async (data: CreatePromotionData): Promise<EmployeePromotion> => {
        return apiPost('/employees/promotions/', data)
    },

    updatePromotion: async (id: string, data: Partial<CreatePromotionData>): Promise<EmployeePromotion> => {
        return apiPut(`/employees/promotions/${id}/`, data)
    },

    deletePromotion: async (id: string): Promise<void> => {
        const { api } = await import('./api')
        await api.delete(`/employees/promotions/${id}/`)
    },

    submitPromotion: async (id: string): Promise<EmployeePromotion> => {
        return apiPost(`/employees/promotions/${id}/submit/`)
    },

    approvePromotion: async (id: string, data: { action: 'approve' | 'reject'; comments?: string }): Promise<EmployeePromotion> => {
        return apiPost(`/employees/promotions/${id}/approve/`, data)
    },


    // Resignations
    getResignations: async (filters?: { status?: string }): Promise<ResignationRequest[]> => {
        const params: Record<string, string> = {}
        if (filters?.status) params.status = filters.status
        const res = await apiGet('/employees/resignations/', params)
        return extractArray(res)
    },

    getResignation: async (id: string): Promise<ResignationRequest> => {
        return apiGet(`/employees/resignations/${id}/`)
    },

    getMyResignation: async (): Promise<ResignationRequest | null> => {
        try {
            return apiGet('/employees/resignations/my_resignation/')
        } catch {
            return null
        }
    },

    createResignation: async (data: CreateResignationData): Promise<ResignationRequest> => {
        return apiPost('/employees/resignations/', data)
    },

    submitResignation: async (id: string): Promise<ResignationRequest> => {
        return apiPost(`/employees/resignations/${id}/submit/`)
    },

    withdrawResignation: async (id: string): Promise<ResignationRequest> => {
        return apiPost(`/employees/resignations/${id}/withdraw/`)
    },

    acceptResignation: async (id: string, data: {
        action: 'accept' | 'reject'
        approved_last_working_date?: string
        rejection_reason?: string
    }): Promise<ResignationRequest> => {
        return apiPost(`/employees/resignations/${id}/accept/`, data)
    },

    // Exit Interview
    getExitInterview: async (resignationId: string): Promise<ExitInterview | null> => {
        try {
            return apiGet(`/employees/exit-interviews/${resignationId}/`)
        } catch {
            return null
        }
    },

    submitExitInterview: async (resignationId: string, data: ExitInterviewFormData): Promise<ExitInterview> => {
        return apiPost(`/employees/exit-interviews/`, { resignation: resignationId, ...data })
    },

    updateExitInterview: async (id: string, data: Partial<ExitInterviewFormData>): Promise<ExitInterview> => {
        return apiPut(`/employees/exit-interviews/${id}/`, data)
    },
}

// Helper to extract array from various response formats
function extractArray(data: any): any[] {
    if (Array.isArray(data)) return data
    if (data?.results && Array.isArray(data.results)) return data.results
    if (data?.data && Array.isArray(data.data)) return data.data
    if (data?.data?.results && Array.isArray(data.data.results)) return data.data.results
    return []
}
