/**
 * Billing Service - API for plans, subscriptions, invoices
 */
import api from './index';

export interface Plan {
    id: string;
    name: string;
    code: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    max_employees: number;
    max_branches: number;
    features: string[];
    is_active: boolean;
}

export interface Subscription {
    id: string;
    organization: string;
    organization_name?: string;
    plan: string;
    plan_name?: string;
    billing_cycle: 'monthly' | 'yearly';
    status: 'active' | 'paused' | 'cancelled' | 'expired';
    start_date: string;
    end_date: string;
    next_billing_date: string;
    auto_renew: boolean;
}

export interface Invoice {
    id: string;
    organization: string;
    subscription: string;
    invoice_number: string;
    amount: number;
    tax: number;
    total: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    due_date: string;
    paid_at?: string;
    billing_period_start: string;
    billing_period_end: string;
}

export interface Payment {
    id: string;
    invoice: string;
    amount: number;
    method: 'card' | 'bank_transfer' | 'upi' | 'cheque';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transaction_id?: string;
    paid_at?: string;
}

export const billingService = {
    // Plans
    getPlans: async () => {
        const response = await api.get('/billing/plans/');
        return response.data;
    },

    getPlan: async (id: string) => {
        const response = await api.get(`/billing/plans/${id}/`);
        return response.data;
    },

    createPlan: async (data: Partial<Plan>) => {
        const response = await api.post('/billing/plans/', data);
        return response.data;
    },

    updatePlan: async (id: string, data: Partial<Plan>) => {
        const response = await api.put(`/billing/plans/${id}/`, data);
        return response.data;
    },

    deletePlan: async (id: string) => {
        await api.delete(`/billing/plans/${id}/`);
    },

    // Subscriptions
    getSubscriptions: async () => {
        const response = await api.get('/billing/subscriptions/');
        return response.data;
    },

    getSubscription: async (id: string) => {
        const response = await api.get(`/billing/subscriptions/${id}/`);
        return response.data;
    },

    createSubscription: async (data: Partial<Subscription>) => {
        const response = await api.post('/billing/subscriptions/', data);
        return response.data;
    },

    updateSubscription: async (id: string, data: Partial<Subscription>) => {
        const response = await api.put(`/billing/subscriptions/${id}/`, data);
        return response.data;
    },

    cancelSubscription: async (id: string) => {
        const response = await api.post(`/billing/subscriptions/${id}/cancel/`);
        return response.data;
    },

    // Invoices
    getInvoices: async () => {
        const response = await api.get('/billing/invoices/');
        return response.data;
    },

    getInvoice: async (id: string) => {
        const response = await api.get(`/billing/invoices/${id}/`);
        return response.data;
    },

    downloadInvoice: async (id: string) => {
        const response = await api.get(`/billing/invoices/${id}/download/`, { responseType: 'blob' });
        return response.data;
    },

    // Payments
    getPayments: async () => {
        const response = await api.get('/billing/payments/');
        return response.data;
    },

    recordPayment: async (data: Partial<Payment>) => {
        const response = await api.post('/billing/payments/', data);
        return response.data;
    }
};

export default billingService;
