/**
 * Tenant Service - Tenant management API calls
 */

import { apiGet, apiPost } from './api'
import type { ApiResponse } from '@/types'

export interface SignupConfig {
    countries: {
        name: string
        code: string
        currency: string
        currency_name: string
        timezone: string
    }[]
    timezones: string[]
    currencies: {
        code: string
        display: string
    }[]
    date_formats: {
        code: string
        display: string
    }[]
}

export interface TenantSignupData {
    name: string
    email: string
    phone?: string
    industry?: string
    company_size?: string
    country: string
    timezone: string
    currency: string
    date_format: string
    admin_email: string
    admin_password: string
    admin_first_name: string
    admin_last_name: string
}


export const tenantService = {
    /**
     * Get configuration for registration/settings
     */
    getConfig: async (): Promise<SignupConfig> => {
        const data = await apiGet<SignupConfig>('/tenants/signup_config/')
        return data
    },

    /**
     * Register a new tenant
     */
    signup: async (data: TenantSignupData): Promise<any> => {
        const response = await apiPost<ApiResponse<any>>('/tenants/', data)
        return response.data
    },
}
