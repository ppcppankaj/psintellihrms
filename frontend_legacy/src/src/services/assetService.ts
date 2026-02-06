/**
 * Assets Service - API calls for Asset Management
 */

import { api } from './api'

export interface AssetCategory {
    id: string
    name: string
    code: string
    description?: string
    icon?: string
    asset_count?: number
}

export interface Asset {
    id: string
    name: string
    asset_tag: string
    serial_number?: string
    description?: string
    category: string
    category_name?: string
    status: 'available' | 'assigned' | 'maintenance' | 'retired'
    status_display?: string
    current_assignee?: string
    assignee_name?: string
    purchase_date?: string
    purchase_price?: number
    vendor?: string
    warranty_expires?: string
    location?: string
    notes?: string
}

export interface AssetAssignment {
    id: string
    asset: string
    asset_name?: string
    asset_tag?: string
    employee: string
    employee_name?: string
    assigned_date: string
    assigned_by?: string
    assigned_by_name?: string
    notes?: string
    returned_date?: string
    return_notes?: string
    is_active?: boolean
}

export interface AssetStats {
    total: number
    available: number
    assigned: number
    maintenance: number
    retired: number
    by_category: { category__name: string; count: number }[]
}

class AssetService {
    private basePath = 'assets'

    // Categories
    async getCategories(): Promise<AssetCategory[]> {
        const response = await api.get(`${this.basePath}/categories/`)
        const data = response.data
        if (Array.isArray(data)) return data
        if (data?.results) return data.results
        if (data?.data) return data.data
        return []
    }

    async createCategory(data: Partial<AssetCategory>): Promise<AssetCategory> {
        const response = await api.post(`${this.basePath}/categories/`, data)
        return response.data
    }

    async updateCategory(id: string, data: Partial<AssetCategory>): Promise<AssetCategory> {
        const response = await api.patch(`${this.basePath}/categories/${id}/`, data)
        return response.data
    }

    // Assets
    async getAssets(params?: { category?: string; status?: string; search?: string }): Promise<Asset[]> {
        const response = await api.get(`${this.basePath}/assets/`, { params })
        const data = response.data
        if (Array.isArray(data)) return data
        if (data?.results) return data.results
        if (data?.data) return data.data
        return []
    }

    async getAsset(id: string): Promise<Asset> {
        const response = await api.get(`${this.basePath}/assets/${id}/`)
        return response.data
    }

    async createAsset(data: Partial<Asset>): Promise<Asset> {
        const response = await api.post(`${this.basePath}/assets/`, data)
        return response.data
    }

    async updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
        const response = await api.patch(`${this.basePath}/assets/${id}/`, data)
        return response.data
    }

    async deleteAsset(id: string): Promise<void> {
        await api.delete(`${this.basePath}/assets/${id}/`)
    }

    async assignAsset(id: string, employeeId: string, notes?: string): Promise<AssetAssignment> {
        const response = await api.post(`${this.basePath}/assets/${id}/assign/`, {
            employee_id: employeeId,
            notes
        })
        return response.data.data || response.data
    }

    async unassignAsset(id: string, notes?: string): Promise<void> {
        await api.post(`${this.basePath}/assets/${id}/unassign/`, { notes })
    }

    async getStats(): Promise<AssetStats> {
        const response = await api.get(`${this.basePath}/assets/stats/`)
        return response.data.data || response.data
    }

    // Assignments
    async getAssignments(params?: { asset?: string; employee?: string }): Promise<AssetAssignment[]> {
        const response = await api.get(`${this.basePath}/assignments/`, { params })
        const data = response.data
        if (Array.isArray(data)) return data
        if (data?.results) return data.results
        if (data?.data) return data.data
        return []
    }
}

export const assetService = new AssetService()
export default assetService
