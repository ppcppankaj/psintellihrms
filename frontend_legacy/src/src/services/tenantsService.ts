/**
 * Tenants Service - API calls for tenant management
 */

import { apiGet } from './api'

export interface Tenant {
    id: string
    name: string
    domain?: string
    created_at: string
}

export const tenantsService = {
    getTenants: async (): Promise<Tenant[]> => {
        const response = await apiGet<{ success: boolean; data: Tenant[] }>('/tenants/')
        return response.data || []
    },

    getTenant: async (id: string): Promise<Tenant> => {
        return apiGet(`/tenants/${id}/`)
    }
}
