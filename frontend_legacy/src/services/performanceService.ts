/**
 * Performance Service - KRAs, KPIs, Competencies API
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api'

// OKR Objective
export interface OKRObjective {
    id: string
    title: string
    description: string
    employee: string
    employee_id: string
    employee_name: string
    cycle: string
    cycle_name: string
    progress: number
    status: 'draft' | 'active' | 'completed' | 'cancelled'
    key_results?: any[]
    created_at?: string
    updated_at?: string
    [key: string]: any
}

// Key Result Area
export interface KeyResultArea {
    id: string
    name: string
    code: string
    description: string
    department_name?: string
    designation_name?: string
    default_weightage: number
    is_active: boolean
}

// Employee KRA Assignment
export interface EmployeeKRA {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    kra: string
    kra_name: string
    kra_description: string
    performance_cycle: string
    cycle_name: string
    weightage: number
    self_rating?: number
    manager_rating?: number
    final_rating?: number
    achievement_summary?: string
    status: 'draft' | 'submitted' | 'reviewed' | 'finalized'
    status_display: string
}

// KPI
export interface KPI {
    id: string
    employee_kra?: string
    employee: string
    employee_id: string
    employee_name: string
    name: string
    description: string
    metric_type: 'numeric' | 'percentage' | 'currency' | 'boolean' | 'rating'
    metric_type_display: string
    unit?: string
    target_value: number
    threshold_value?: number
    stretch_value?: number
    current_value: number
    achievement_percentage: number
    period_start: string
    period_end: string
    status: 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'exceeded'
    status_display: string
}

// Competency
export interface Competency {
    id: string
    name: string
    code: string
    category: 'technical' | 'behavioral' | 'leadership' | 'functional'
    category_display: string
    description: string
    level_descriptions: {
        level_1?: string
        level_2?: string
        level_3?: string
        level_4?: string
        level_5?: string
    }
    is_active: boolean
}

// Employee Competency Assessment
export interface EmployeeCompetency {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    competency: string
    competency_name: string
    competency_category: string
    performance_cycle: string
    cycle_name: string
    required_level: number
    self_assessment?: number
    manager_assessment?: number
    final_level?: number
    gap: number
    development_notes?: string
    status: 'pending' | 'self_assessed' | 'reviewed' | 'finalized'
    status_display: string
}

// Training Recommendation
export interface TrainingRecommendation {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    competency: string
    competency_name: string
    cycle: string
    cycle_name: string
    suggested_training: string
    priority: 'low' | 'medium' | 'high'
    is_completed: boolean
    completion_date?: string
    notes?: string
}

export interface UpdateKPIProgress {
    current_value: number
    notes?: string
}

export const performanceService = {
    // KRAs
    getKRAs: async (): Promise<KeyResultArea[]> => {
        const response = await apiGet<any>('/performance/kras/')
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getKRA: async (id: string): Promise<KeyResultArea> => {
        return apiGet(`/performance/kras/${id}/`)
    },

    createKRA: async (data: Partial<KeyResultArea>): Promise<KeyResultArea> => {
        return apiPost('/performance/kras/', data)
    },

    updateKRA: async (id: string, data: Partial<KeyResultArea>): Promise<KeyResultArea> => {
        return apiPut(`/performance/kras/${id}/`, data)
    },

    deleteKRA: async (id: string): Promise<void> => {
        return apiDelete(`/performance/kras/${id}/`)
    },

    // Employee KRAs
    getEmployeeKRAs: async (filters?: { employee_id?: string; cycle_id?: string }): Promise<EmployeeKRA[]> => {
        const params: Record<string, string> = {}
        if (filters?.employee_id) params.employee = filters.employee_id
        if (filters?.cycle_id) params.cycle = filters.cycle_id
        const response = await apiGet<any>('/performance/employee-kras/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getMyKRAs: async (cycleId?: string): Promise<EmployeeKRA[]> => {
        const params: Record<string, string> = {}
        if (cycleId) params.cycle = cycleId
        const response = await apiGet<any>('/performance/employee-kras/my_kras/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    submitSelfRating: async (id: string, data: {
        self_rating: number
        achievement_summary: string
    }): Promise<EmployeeKRA> => {
        return apiPost(`/performance/employee-kras/${id}/self_rate/`, data)
    },

    submitManagerRating: async (id: string, data: {
        manager_rating: number
        comments?: string
    }): Promise<EmployeeKRA> => {
        return apiPost(`/performance/employee-kras/${id}/manager_rate/`, data)
    },

    // KPIs
    getKPIs: async (filters?: { employee_id?: string }): Promise<KPI[]> => {
        const params: Record<string, string> = {}
        if (filters?.employee_id) params.employee = filters.employee_id
        const response = await apiGet<any>('/performance/kpis/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getMyKPIs: async (): Promise<KPI[]> => {
        const response = await apiGet<any>('/performance/kpis/my_kpis/')
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    createKPI: async (data: Partial<KPI>): Promise<KPI> => {
        return apiPost('/performance/kpis/', data)
    },

    updateKPIProgress: async (id: string, data: UpdateKPIProgress): Promise<KPI> => {
        return apiPost(`/performance/kpis/${id}/update_progress/`, data)
    },

    // Competencies
    getCompetencies: async (): Promise<Competency[]> => {
        const response = await apiGet<any>('/performance/competencies/')
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    createCompetency: async (data: Partial<Competency>): Promise<Competency> => {
        return apiPost('/performance/competencies/', data)
    },

    updateCompetency: async (id: string, data: Partial<Competency>): Promise<Competency> => {
        return apiPut(`/performance/competencies/${id}/`, data)
    },

    // Employee Competencies
    getEmployeeCompetencies: async (filters?: { employee_id?: string; cycle_id?: string }): Promise<EmployeeCompetency[]> => {
        const params: Record<string, string> = {}
        if (filters?.employee_id) params.employee = filters.employee_id
        if (filters?.cycle_id) params.cycle = filters.cycle_id
        const response = await apiGet<any>('/performance/employee-competencies/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getMyCompetencies: async (cycleId?: string): Promise<EmployeeCompetency[]> => {
        const params: Record<string, string> = {}
        if (cycleId) params.cycle = cycleId
        const response = await apiGet<any>('/performance/employee-competencies/my_competencies/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    submitSelfAssessment: async (id: string, data: {
        self_assessment: number
        development_notes?: string
    }): Promise<EmployeeCompetency> => {
        return apiPost(`/performance/employee-competencies/${id}/self_assess/`, data)
    },

    submitManagerAssessment: async (id: string, data: {
        manager_assessment: number
        notes?: string
    }): Promise<EmployeeCompetency> => {
        return apiPost(`/performance/employee-competencies/${id}/manager_assess/`, data)
    },

    // Recommendations
    getRecommendations: async (filters?: { employee_id?: string; cycle_id?: string }): Promise<TrainingRecommendation[]> => {
        const params: Record<string, string> = {}
        if (filters?.employee_id) params.employee = filters.employee_id
        if (filters?.cycle_id) params.cycle = filters.cycle_id
        const response = await apiGet<any>('/performance/recommendations/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getMyRecommendations: async (): Promise<TrainingRecommendation[]> => {
        const response = await apiGet<any>('/performance/recommendations/my_recommendations/')
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    // --- Review Cycles ---
    getPerformanceCycles: async (): Promise<any[]> => {
        const response = await apiGet<any>('/performance/cycles/')
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    createPerformanceCycle: async (data: any): Promise<any> => {
        return apiPost('/performance/cycles/', data)
    },

    updatePerformanceCycle: async (id: string, data: any): Promise<any> => {
        return apiPut(`/performance/cycles/${id}/`, data)
    },

    getActiveCycle: async (): Promise<any> => {
        const response = await apiGet<any>('/performance/cycles/?status=active')
        const results = response.results || response
        return results[0] || null
    },

    // --- Reviews ---
    getPerformanceReviews: async (filters?: { employee_id?: string; cycle_id?: string; status?: string }): Promise<any[]> => {
        const params: Record<string, string> = {}
        if (filters?.employee_id) params.employee = filters.employee_id
        if (filters?.cycle_id) params.cycle = filters.cycle_id
        if (filters?.status) params.status = filters.status
        const response = await apiGet<any>('/performance/reviews/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getMyReviews: async (): Promise<any[]> => {
        const response = await apiGet<any>('/performance/reviews/my_reviews/')
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getReview: async (id: string): Promise<any> => {
        return apiGet(`/performance/reviews/${id}/`)
    },

    createReview: async (data: any): Promise<any> => {
        return apiPost('/performance/reviews/', data)
    },

    updateReview: async (id: string, data: any): Promise<any> => {
        return apiPut(`/performance/reviews/${id}/`, data)
    },

    submitReviewSelfRating: async (id: string, data: { self_rating: number; self_comments: string }): Promise<any> => {
        return apiPost(`/performance/reviews/${id}/submit_self_review/`, data)
    },

    submitReviewManagerRating: async (id: string, data: { manager_rating: number; manager_comments: string }): Promise<any> => {
        return apiPost(`/performance/reviews/${id}/submit_manager_review/`, data)
    },

    // --- Team Performance ---
    createEmployeeKRA: async (data: Partial<EmployeeKRA>): Promise<EmployeeKRA> => {
        return apiPost('/performance/employee-kras/', data)
    },

    getTeamKRAs: async (cycleId?: string): Promise<EmployeeKRA[]> => {
        const params: Record<string, string> = {}
        if (cycleId) params.cycle = cycleId
        const response = await apiGet<any>('/performance/employee-kras/team_kras/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    // --- OKRs ---
    getOKRObjectives: async (filters?: { employee_id?: string; cycle_id?: string; status?: string }): Promise<OKRObjective[]> => {
        const params: Record<string, string> = {}
        if (filters?.employee_id) params.employee = filters.employee_id
        if (filters?.cycle_id) params.cycle = filters.cycle_id
        if (filters?.status) params.status = filters.status
        const response = await apiGet<any>('/performance/okrs/', params)
        if (response.data && Array.isArray(response.data)) return response.data
        return response.results || response
    },

    getOKRObjective: async (id: string): Promise<OKRObjective> => {
        return apiGet(`/performance/okrs/${id}/`)
    },

    createOKRObjective: async (data: Partial<OKRObjective>): Promise<OKRObjective> => {
        return apiPost('/performance/okrs/', data)
    },

    updateOKRObjective: async (id: string, data: Partial<OKRObjective>): Promise<OKRObjective> => {
        return apiPut(`/performance/okrs/${id}/`, data)
    },

    deleteOKRObjective: async (id: string): Promise<void> => {
        return apiDelete(`/performance/okrs/${id}/`)
    },
}
