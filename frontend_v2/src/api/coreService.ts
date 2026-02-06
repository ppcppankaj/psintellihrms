import api from './index';
import type { PaginatedResponse } from './types';

export interface Organization {
    id: string;
    name: string;
    logo: string | null;
    email: string;
    subscription_status: string;
    timezone: string;
    currency: string;
}

export const coreService = {
    getOrganizations: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Organization>>('/core/organizations/', { params });
        return response.data;
    },

    getOrganization: async (id: string) => {
        const response = await api.get<Organization>(`/core/organizations/${id}/`);
        return response.data;
    },
    getAuditLogs: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/core/audit-logs/', { params });
        return response.data;
    },
    getFeatureFlags: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/core/feature-flags/', { params });
        return response.data;
    },
    createOrganization: async (data: Partial<Organization>) => {
        const response = await api.post<Organization>('/core/organizations/', data);
        return response.data;
    },
    updateOrganization: async (id: string, data: Partial<Organization>) => {
        const response = await api.put<Organization>(`/core/organizations/${id}/`, data);
        return response.data;
    },
    deleteOrganization: async (id: string) => {
        await api.delete(`/core/organizations/${id}/`);
    },

    // Branches
    getBranches: async (params?: any) => {
        const response = await api.get('/authentication/branches/', { params });
        return response.data;
    },
    getBranch: async (id: string) => {
        const response = await api.get(`/authentication/branches/${id}/`);
        return response.data;
    },
    createBranch: async (data: any) => {
        const response = await api.post('/authentication/branches/', data);
        return response.data;
    },
    updateBranch: async (id: string, data: any) => {
        const response = await api.put(`/authentication/branches/${id}/`, data);
        return response.data;
    },
    deleteBranch: async (id: string) => {
        await api.delete(`/authentication/branches/${id}/`);
    }
};
