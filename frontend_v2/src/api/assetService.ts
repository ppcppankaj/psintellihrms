import api from './index';
import type { PaginatedResponse } from './types';

export interface AssetCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
    depreciation_rate?: number;
    is_active?: boolean;
}

export interface AssetAssignment {
    id: string;
    asset: string;
    asset_name?: string;
    employee: string;
    employee_name?: string;
    assigned_date: string;
    returned_date?: string;
    condition_at_assignment: string;
    condition_at_return?: string;
    notes?: string;
}

export interface Asset {
    id: string;
    name: string;
    asset_tag: string;
    serial_number?: string;
    category: { id: string; name: string };
    status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'disposed';
    condition: 'new' | 'good' | 'fair' | 'poor';
    current_assignee: string | null;
    current_assignee_name?: string;
    purchase_date?: string;
    purchase_price?: number;
    warranty_expiry?: string;
    location?: string;
    notes?: string;
}

export const assetService = {
    // Assets
    getAssets: async (params?: Record<string, unknown>) => {
        const response = await api.get<PaginatedResponse<Asset>>('/assets/', { params });
        return response.data;
    },
    getAsset: async (id: string) => {
        const response = await api.get<Asset>(`/assets/${id}/`);
        return response.data;
    },
    createAsset: async (data: Partial<Asset>) => {
        const response = await api.post<Asset>('/assets/', data);
        return response.data;
    },
    updateAsset: async (id: string, data: Partial<Asset>) => {
        const response = await api.put<Asset>(`/assets/${id}/`, data);
        return response.data;
    },
    deleteAsset: async (id: string) => {
        await api.delete(`/assets/${id}/`);
    },
    assignAsset: async (id: string, employeeId: string, notes?: string) => {
        const response = await api.post(`/assets/${id}/assign/`, { employee_id: employeeId, notes });
        return response.data;
    },
    returnAsset: async (id: string, condition: string, notes?: string) => {
        const response = await api.post(`/assets/${id}/return/`, { condition, notes });
        return response.data;
    },
    sendToMaintenance: async (id: string, notes: string) => {
        const response = await api.post(`/assets/${id}/maintenance/`, { notes });
        return response.data;
    },

    // Categories
    getCategories: async () => {
        const response = await api.get<PaginatedResponse<AssetCategory>>('/assets/categories/');
        return response.data;
    },
    createCategory: async (data: Partial<AssetCategory>) => {
        const response = await api.post<AssetCategory>('/assets/categories/', data);
        return response.data;
    },
    updateCategory: async (id: string, data: Partial<AssetCategory>) => {
        const response = await api.put<AssetCategory>(`/assets/categories/${id}/`, data);
        return response.data;
    },
    deleteCategory: async (id: string) => {
        await api.delete(`/assets/categories/${id}/`);
    },

    // Assignments History
    getAssignments: async (assetId?: string) => {
        const params = assetId ? { asset: assetId } : {};
        const response = await api.get<PaginatedResponse<AssetAssignment>>('/assets/assignments/', { params });
        return response.data;
    }
};

