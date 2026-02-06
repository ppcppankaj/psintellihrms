import api from './index';
import type { PaginatedResponse } from './types';

export interface PerformanceCycle {
    id: string;
    name: string;
    year: number;
    status: 'draft' | 'active' | 'review' | 'completed';
}

export interface PerformanceReview {
    id: string;
    employee: string;
    cycle: string;
    status: 'pending' | 'self_review' | 'manager_review' | 'completed';
    final_rating: number | null;
}

export const performanceService = {
    getCycles: async (params?: any) => {
        const response = await api.get<PaginatedResponse<PerformanceCycle>>('/performance/cycles/', { params });
        return response.data;
    },
    createCycle: async (data: Partial<PerformanceCycle>) => {
        const response = await api.post<PerformanceCycle>('/performance/cycles/', data);
        return response.data;
    },
    getReviews: async (params?: any) => {
        const response = await api.get<PaginatedResponse<PerformanceReview>>('/performance/reviews/', { params });
        return response.data;
    },
    submitManagerReview: async (id: string, data: any) => {
        const response = await api.post(`/performance/reviews/${id}/manager_review/`, data);
        return response.data;
    },
    getKRAs: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/performance/kras/', { params });
        return response.data;
    },
    getKPIs: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/performance/kpis/', { params });
        return response.data;
    },
    getOKRs: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/performance/okrs/', { params });
        return response.data;
    },
    getCompetencies: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/performance/competencies/', { params });
        return response.data;
    }
};
