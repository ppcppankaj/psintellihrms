/**
 * Billing Service - API calls for Plans, Subscriptions, Invoices, Bank Details
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './api'

export interface Plan {
    id: string
    name: string
    code: string
    description: string
    price_monthly: number
    price_yearly: number
    max_employees?: number
    max_admins?: number
    features: Record<string, boolean>
    is_trial: boolean
    trial_days: number
    created_at: string
}

export interface Subscription {
    id: string
    tenant: string
    plan: string
    plan_details: Plan
    billing_cycle: 'monthly' | 'yearly'
    price: number
    start_date: string
    end_date: string
    next_billing_date: string
    status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
    payment_method?: any
}

export interface Invoice {
    id: string
    subscription: string
    invoice_number: string
    amount: number
    tax: number
    total: number
    billing_period_start: string
    billing_period_end: string
    status: 'draft' | 'pending' | 'paid' | 'failed' | 'refunded'
    due_date: string
    paid_at?: string
    pdf_file?: string
    created_at: string
}

export interface BankDetails {
    id: string
    account_name: string
    account_number: string
    bank_name: string
    ifsc_code: string
    swift_code?: string
    branch_name?: string
    is_active: boolean
}

export const billingService = {
    // --- Plans ---
    getPlans: async (): Promise<Plan[]> => {
        const response = await apiGet<{ success: boolean; data: Plan[] }>('/billing/plans/')
        return response.data || []
    },

    getPlan: async (id: string): Promise<Plan> => {
        return apiGet(`/billing/plans/${id}/`)
    },

    // --- Subscriptions ---
    getSubscriptions: async (): Promise<Subscription[]> => {
        const response = await apiGet<{ success: boolean; data: Subscription[] }>('/billing/subscriptions/')
        return response.data || []
    },

    getMySubscription: async (): Promise<Subscription | null> => {
        // Tenants usually have one, or we filter by tenant in backend
        const subs = await apiGet<Subscription[]>('/billing/subscriptions/')
        return subs.length > 0 ? subs[0] : null
    },

    // --- Invoices ---
    getInvoices: async (): Promise<Invoice[]> => {
        const response = await apiGet<{ success: boolean; data: Invoice[] }>('/billing/invoices/')
        return response.data || []
    },

    // Admin only
    createInvoice: async (data: Partial<Invoice>): Promise<Invoice> => {
        return apiPost('/billing/invoices/', data)
    },

    updateInvoice: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
        return apiPatch(`/billing/invoices/${id}/`, data)
    },

    // --- Bank Details ---
    getBankDetails: async (): Promise<BankDetails[]> => {
        const response = await apiGet<{ results: BankDetails[] }>('/billing/bank-details/')
        return response.results || []
    },

    // Admin only
    createBankDetails: async (data: Partial<BankDetails>): Promise<BankDetails> => {
        return apiPost('/billing/bank-details/', data)
    },

    updateBankDetails: async (id: string, data: Partial<BankDetails>): Promise<BankDetails> => {
        return apiPatch(`/billing/bank-details/${id}/`, data)
    },

    deleteBankDetails: async (id: string): Promise<void> => {
        return apiDelete(`/billing/bank-details/${id}/`)
    },

    // --- Plans (Admin) ---
    createPlan: async (data: Partial<Plan>): Promise<Plan> => {
        return apiPost('/billing/plans/', data)
    },

    updatePlan: async (id: string, data: Partial<Plan>): Promise<Plan> => {
        return apiPatch(`/billing/plans/${id}/`, data)
    },

    deletePlan: async (id: string): Promise<void> => {
        return apiDelete(`/billing/plans/${id}/`)
    },

    // --- Subscriptions (Admin) ---
    createSubscription: async (data: Partial<Subscription>): Promise<Subscription> => {
        return apiPost('/billing/subscriptions/', data)
    },

    updateSubscription: async (id: string, data: Partial<Subscription>): Promise<Subscription> => {
        return apiPatch(`/billing/subscriptions/${id}/`, data)
    },

    deleteSubscription: async (id: string): Promise<void> => {
        return apiDelete(`/billing/subscriptions/${id}/`)
    }
}
