/**
 * Onboarding Service - API for employee onboarding workflows
 */
import api from './index';

export interface OnboardingTemplate {
    id: string;
    name: string;
    code: string;
    description: string;
    department?: string;
    designation?: string;
    is_default: boolean;
    is_active: boolean;
    stages: string[];
    completion_days: number;
    tasks?: OnboardingTaskTemplate[];
}

export interface OnboardingTaskTemplate {
    id: string;
    template: string;
    title: string;
    description: string;
    stage: 'pre_joining' | 'day_one' | 'first_week' | 'first_month' | 'first_quarter';
    category: string;
    owner_type: 'employee' | 'hr' | 'manager' | 'it' | 'admin' | 'buddy';
    is_mandatory: boolean;
    due_days_offset: number;
    order: number;
}

export interface EmployeeOnboarding {
    id: string;
    employee: string;
    employee_name?: string;
    template: string;
    template_name?: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
    joining_date: string;
    current_stage: string;
    progress_percentage: number;
    tasks_total: number;
    tasks_completed: number;
    hr_manager?: string;
    buddy?: string;
    notes: string;
}

export interface OnboardingTaskProgress {
    id: string;
    onboarding: string;
    task_template: string;
    title: string;
    description: string;
    stage: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
    assigned_to?: string;
    due_date: string;
    completed_at?: string;
    completed_by?: string;
    notes: string;
}

export interface OnboardingDocument {
    id: string;
    onboarding: string;
    document_type: string;
    name: string;
    file: string;
    status: 'pending' | 'submitted' | 'verified' | 'rejected';
    verified_by?: string;
    verified_at?: string;
    rejection_reason?: string;
}

export const onboardingService = {
    // Templates
    getTemplates: async () => {
        const response = await api.get('/onboarding/templates/');
        return response.data;
    },

    getTemplate: async (id: string) => {
        const response = await api.get(`/onboarding/templates/${id}/`);
        return response.data;
    },

    createTemplate: async (data: Partial<OnboardingTemplate>) => {
        const response = await api.post('/onboarding/templates/', data);
        return response.data;
    },

    updateTemplate: async (id: string, data: Partial<OnboardingTemplate>) => {
        const response = await api.put(`/onboarding/templates/${id}/`, data);
        return response.data;
    },

    deleteTemplate: async (id: string) => {
        const response = await api.delete(`/onboarding/templates/${id}/`);
        return response.data;
    },

    duplicateTemplate: async (id: string, newName: string) => {
        const response = await api.post(`/onboarding/templates/${id}/duplicate/`, { name: newName });
        return response.data;
    },

    // Task Templates
    getTaskTemplates: async (templateId?: string) => {
        const params = templateId ? { template: templateId } : {};
        const response = await api.get('/onboarding/task-templates/', { params });
        return response.data;
    },

    createTaskTemplate: async (data: Partial<OnboardingTaskTemplate>) => {
        const response = await api.post('/onboarding/task-templates/', data);
        return response.data;
    },

    updateTaskTemplate: async (id: string, data: Partial<OnboardingTaskTemplate>) => {
        const response = await api.put(`/onboarding/task-templates/${id}/`, data);
        return response.data;
    },

    deleteTaskTemplate: async (id: string) => {
        const response = await api.delete(`/onboarding/task-templates/${id}/`);
        return response.data;
    },

    // Employee Onboarding
    getOnboardings: async (status?: string) => {
        const params = status ? { status } : {};
        const response = await api.get('/onboarding/employee-onboardings/', { params });
        return response.data;
    },

    getOnboarding: async (id: string) => {
        const response = await api.get(`/onboarding/employee-onboardings/${id}/`);
        return response.data;
    },

    initiateOnboarding: async (data: { employee_id: string; template_id: string; joining_date: string }) => {
        const response = await api.post('/onboarding/employee-onboardings/initiate/', data);
        return response.data;
    },

    getMyOnboarding: async () => {
        const response = await api.get('/onboarding/employee-onboardings/my_onboarding/');
        return response.data;
    },

    getMyTasks: async () => {
        const response = await api.get('/onboarding/employee-onboardings/my_tasks/');
        return response.data;
    },

    getOnboardingSummary: async (id: string) => {
        const response = await api.get(`/onboarding/employee-onboardings/${id}/summary/`);
        return response.data;
    },

    cancelOnboarding: async (id: string) => {
        const response = await api.post(`/onboarding/employee-onboardings/${id}/cancel/`);
        return response.data;
    },

    // Task Progress
    getTaskProgress: async (onboardingId: string) => {
        const response = await api.get('/onboarding/task-progress/', { params: { onboarding: onboardingId } });
        return response.data;
    },

    completeTask: async (taskId: string, notes?: string) => {
        const response = await api.post(`/onboarding/task-progress/${taskId}/complete/`, { notes });
        return response.data;
    },

    skipTask: async (taskId: string, reason?: string) => {
        const response = await api.post(`/onboarding/task-progress/${taskId}/skip/`, { reason });
        return response.data;
    },

    startTask: async (taskId: string) => {
        const response = await api.post(`/onboarding/task-progress/${taskId}/start/`);
        return response.data;
    },

    // Documents
    getDocuments: async (onboardingId: string) => {
        const response = await api.get('/onboarding/documents/', { params: { onboarding: onboardingId } });
        return response.data;
    },

    uploadDocument: async (data: FormData) => {
        const response = await api.post('/onboarding/documents/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    verifyDocument: async (id: string, approved: boolean, reason?: string) => {
        const response = await api.post(`/onboarding/documents/${id}/verify/`, { approved, rejection_reason: reason });
        return response.data;
    }
};

export default onboardingService;
