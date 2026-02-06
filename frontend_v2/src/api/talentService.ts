import api from './index';
import type { PaginatedResponse } from './types';

export interface JobPosting {
    id: string;
    title: string;
    code: string;
    status: 'draft' | 'open' | 'on_hold' | 'closed';
    department: string;
    location: string;
    positions: number;
}

export interface Candidate {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    source: string;
}

export interface JobApplication {
    id: string;
    job: string;
    candidate: string;
    stage: string;
    ai_score: number | null;
}

export const talentService = {
    getJobs: async (params?: any) => {
        const response = await api.get<PaginatedResponse<JobPosting>>('/recruitment/jobs/', { params });
        return response.data;
    },
    createJob: async (data: Partial<JobPosting>) => {
        const response = await api.post<JobPosting>('/recruitment/jobs/', data);
        return response.data;
    },
    getCandidates: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Candidate>>('/recruitment/candidates/', { params });
        return response.data;
    },
    getApplications: async (params?: any) => {
        const response = await api.get<PaginatedResponse<JobApplication>>('/recruitment/applications/', { params });
        return response.data;
    },
    updateApplicationStage: async (id: string, stage: string) => {
        const response = await api.patch(`/recruitment/applications/${id}/`, { stage });
        return response.data;
    },
    getInterviews: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/recruitment/interviews/', { params });
        return response.data;
    },
    getOffers: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/recruitment/offers/', { params });
        return response.data;
    }
};
