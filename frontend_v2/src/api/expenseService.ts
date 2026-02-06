import api from './index';
import type { PaginatedResponse } from './types';

export interface ExpenseCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
    is_active?: boolean;
}

export interface ExpenseLineItem {
    id: string;
    claim: string;
    category: string;
    category_name?: string;
    description: string;
    amount: number;
    receipt?: string;
    expense_date: string;
}

export interface ExpenseAdvance {
    id: string;
    employee: string;
    employee_name?: string;
    amount: number;
    purpose: string;
    status: 'pending' | 'approved' | 'disbursed' | 'settled' | 'rejected';
    requested_date: string;
    approved_at?: string;
    disbursed_at?: string;
}

export interface ExpenseClaim {
    id: string;
    employee: string;
    employee_name?: string;
    title: string;
    description: string;
    claim_date: string;
    expense_from: string;
    expense_to: string;
    total_claimed_amount: string;
    total_approved_amount: string;
    total_paid_amount: string;
    status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'paid' | 'cancelled';
    payment_status: 'not_paid' | 'partially_paid' | 'paid';
    receipt?: string;
    approved_at?: string;
    line_items?: ExpenseLineItem[];
}

export const expenseService = {
    // Claims
    getClaims: async (params?: Record<string, unknown>) => {
        const response = await api.get<PaginatedResponse<ExpenseClaim>>('/expenses/claims/', { params });
        return response.data;
    },
    getClaim: async (id: string) => {
        const response = await api.get<ExpenseClaim>(`/expenses/claims/${id}/`);
        return response.data;
    },
    createClaim: async (data: Partial<ExpenseClaim>) => {
        const response = await api.post<ExpenseClaim>('/expenses/claims/', data);
        return response.data;
    },
    updateClaim: async (id: string, data: Partial<ExpenseClaim>) => {
        const response = await api.put<ExpenseClaim>(`/expenses/claims/${id}/`, data);
        return response.data;
    },
    deleteClaim: async (id: string) => {
        await api.delete(`/expenses/claims/${id}/`);
    },
    submitClaim: async (id: string) => {
        const response = await api.post<ExpenseClaim>(`/expenses/claims/${id}/submit/`);
        return response.data;
    },
    approveClaim: async (id: string, amount?: number) => {
        const response = await api.post<ExpenseClaim>(`/expenses/claims/${id}/approve/`, { approved_amount: amount });
        return response.data;
    },
    rejectClaim: async (id: string, reason: string) => {
        const response = await api.post<ExpenseClaim>(`/expenses/claims/${id}/reject/`, { reason });
        return response.data;
    },

    // Line Items
    getLineItems: async (claimId: string) => {
        const response = await api.get<PaginatedResponse<ExpenseLineItem>>('/expenses/line-items/', { params: { claim: claimId } });
        return response.data;
    },
    createLineItem: async (data: Partial<ExpenseLineItem>) => {
        const response = await api.post<ExpenseLineItem>('/expenses/line-items/', data);
        return response.data;
    },
    deleteLineItem: async (id: string) => {
        await api.delete(`/expenses/line-items/${id}/`);
    },

    // Categories
    getCategories: async () => {
        const response = await api.get<PaginatedResponse<ExpenseCategory>>('/expenses/categories/');
        return response.data;
    },
    createCategory: async (data: Partial<ExpenseCategory>) => {
        const response = await api.post<ExpenseCategory>('/expenses/categories/', data);
        return response.data;
    },
    updateCategory: async (id: string, data: Partial<ExpenseCategory>) => {
        const response = await api.put<ExpenseCategory>(`/expenses/categories/${id}/`, data);
        return response.data;
    },
    deleteCategory: async (id: string) => {
        await api.delete(`/expenses/categories/${id}/`);
    },

    // Advances
    getAdvances: async (params?: Record<string, unknown>) => {
        const response = await api.get<PaginatedResponse<ExpenseAdvance>>('/expenses/advances/', { params });
        return response.data;
    },
    createAdvance: async (data: Partial<ExpenseAdvance>) => {
        const response = await api.post<ExpenseAdvance>('/expenses/advances/', data);
        return response.data;
    },
    approveAdvance: async (id: string) => {
        const response = await api.post<ExpenseAdvance>(`/expenses/advances/${id}/approve/`);
        return response.data;
    },
    disburseAdvance: async (id: string) => {
        const response = await api.post<ExpenseAdvance>(`/expenses/advances/${id}/disburse/`);
        return response.data;
    }
};

