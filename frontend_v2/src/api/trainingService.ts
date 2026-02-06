/**
 * Training Service - API for training programs, courses, enrollments
 */
import api from './index';
import type { PaginatedResponse } from './types';

export interface TrainingCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
}

export interface TrainingProgram {
    id: string;
    title: string;
    code: string;
    category: string;
    category_name?: string;
    description: string;
    duration_hours: number;
    is_mandatory: boolean;
    is_active: boolean;
    instructor?: string;
    instructor_name?: string;
    max_participants?: number;
    location?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
}

export interface TrainingEnrollment {
    id: string;
    program: string;
    program_title?: string;
    employee: string;
    employee_name?: string;
    status: 'enrolled' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    enrolled_at: string;
    started_at?: string;
    completed_at?: string;
    score?: number;
    certificate_url?: string;
}

export interface TrainingMaterial {
    id: string;
    program: string;
    title: string;
    file_url?: string;
    content_type: 'video' | 'document' | 'quiz' | 'link';
    duration_minutes?: number;
    order: number;
}

export const trainingService = {
    // Programs
    getPrograms: async (params?: Record<string, unknown>) => {
        const response = await api.get<PaginatedResponse<TrainingProgram>>('/training/programs/', { params });
        return response.data;
    },
    getProgram: async (id: string) => {
        const response = await api.get<TrainingProgram>(`/training/programs/${id}/`);
        return response.data;
    },
    createProgram: async (data: Partial<TrainingProgram>) => {
        const response = await api.post<TrainingProgram>('/training/programs/', data);
        return response.data;
    },
    updateProgram: async (id: string, data: Partial<TrainingProgram>) => {
        const response = await api.put<TrainingProgram>(`/training/programs/${id}/`, data);
        return response.data;
    },
    deleteProgram: async (id: string) => {
        await api.delete(`/training/programs/${id}/`);
    },

    // Categories
    getCategories: async () => {
        const response = await api.get<PaginatedResponse<TrainingCategory>>('/training/categories/');
        return response.data;
    },
    createCategory: async (data: Partial<TrainingCategory>) => {
        const response = await api.post<TrainingCategory>('/training/categories/', data);
        return response.data;
    },

    // Enrollments
    getEnrollments: async (params?: Record<string, unknown>) => {
        const response = await api.get<PaginatedResponse<TrainingEnrollment>>('/training/enrollments/', { params });
        return response.data;
    },
    enrollEmployee: async (programId: string, employeeId: string) => {
        const response = await api.post<TrainingEnrollment>('/training/enrollments/', {
            program: programId,
            employee: employeeId
        });
        return response.data;
    },
    updateEnrollmentStatus: async (id: string, status: string, score?: number) => {
        const response = await api.patch<TrainingEnrollment>(`/training/enrollments/${id}/`, { status, score });
        return response.data;
    },

    // Materials
    getMaterials: async (programId: string) => {
        const response = await api.get<PaginatedResponse<TrainingMaterial>>('/training/materials/', {
            params: { program: programId }
        });
        return response.data;
    },
    uploadMaterial: async (data: FormData) => {
        const response = await api.post<TrainingMaterial>('/training/materials/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
