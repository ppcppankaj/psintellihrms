/**
 * Expense Service - Expense Claims & Advances API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api'
import { useAuthStore } from '@/store/authStore'

const shouldBypassForSuperuser = () => {
    const { user, tenant, tokens } = useAuthStore.getState()
    // Avoid tenant calls before user profile is loaded
    if (!user) return true

    // Superusers should not hit tenant-scoped expense APIs at all
    if (user.is_superuser) return true

    const isPublicSuper = Boolean(
        user?.is_superuser && (
            !tenant ||
            (tenant as any)?.is_public ||
            (tenant as any)?.slug === 'public'
        )
    )
    return isPublicSuper || !tokens?.access
}

// Types
export interface ExpenseCategory {
    id: string
    name: string
    code: string
    description: string
    max_limit_per_claim?: number
    max_monthly_limit?: number
    requires_receipt: boolean
    is_active: boolean
}

export interface ExpenseItem {
    id?: string
    category: string
    category_name?: string
    expense_date: string
    description: string
    claimed_amount: number
    approved_amount?: number
    receipt?: File | string
    receipt_number?: string
    vendor_name?: string
    is_approved?: boolean
    rejection_reason?: string
}

export interface ExpenseClaim {
    id: string
    claim_number: string
    employee: string
    employee_id: string
    employee_name: string
    title: string
    description: string
    claim_date: string
    expense_from: string
    expense_to: string
    total_claimed_amount: number
    total_approved_amount: number
    total_paid_amount: number
    status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'paid' | 'cancelled'
    status_display: string
    payment_status: 'not_paid' | 'partially_paid' | 'paid'
    payment_status_display: string
    current_approver_name?: string
    approved_by_name?: string
    approved_at?: string
    rejection_reason?: string
    item_count: number
    items?: ExpenseItem[]
}

export interface CreateExpenseClaimData {
    title: string
    description?: string
    claim_date: string
    expense_from: string
    expense_to: string
    items: Omit<ExpenseItem, 'id' | 'category_name' | 'is_approved' | 'rejection_reason' | 'approved_amount'>[]
}

export interface ApproveExpenseData {
    action: 'approve' | 'reject' | 'return'
    comments?: string
    item_adjustments?: { item_id: string; approved_amount: number; rejection_reason?: string }[]
}

export interface ProcessPaymentData {
    amount: number
    payment_mode: 'bank_transfer' | 'cash' | 'cheque' | 'wallet'
    payment_reference?: string
    adjust_advance_id?: string
}

export interface EmployeeAdvance {
    id: string
    advance_number: string
    employee: string
    employee_id: string
    employee_name: string
    purpose: string
    advance_date: string
    amount: number
    settlement_type: 'expense' | 'salary' | 'mixed'
    amount_settled: number
    remaining_balance: number
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'disbursed' | 'settled' | 'cancelled'
    status_display: string
    approved_by_name?: string
    approved_at?: string
    rejection_reason?: string
    disbursed_at?: string
    disbursement_mode?: string
    disbursement_reference?: string
}

export interface CreateAdvanceData {
    purpose: string
    advance_date: string
    amount: number
    settlement_type: 'expense' | 'salary' | 'mixed'
    deduction_start_month?: string
    monthly_deduction_amount?: number
}

export interface ExpenseSummary {
    total_claimed: number
    total_approved: number
    total_paid: number
    claim_count: number
    by_category: { category_name: string; total: number; count: number }[]
}

export const expenseService = {
    // Categories
    getCategories: async (active_only = true): Promise<ExpenseCategory[]> => {
        if (shouldBypassForSuperuser()) return []
        const params: Record<string, string> = { is_active: String(active_only) }
        return apiGet('/expenses/categories/', params)
    },

    createCategory: async (data: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
        return apiPost('/expenses/categories/', data)
    },

    updateCategory: async (id: string, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
        return apiPut(`/expenses/categories/${id}/`, data)
    },

    // Expense Claims
    getClaims: async (filters?: {
        status?: string
        employee_id?: string
        from_date?: string
        to_date?: string
    }): Promise<ExpenseClaim[]> => {
        if (shouldBypassForSuperuser()) return []
        const params: Record<string, string> = {}
        if (filters?.status) params.status = filters.status
        if (filters?.employee_id) params.employee = filters.employee_id
        if (filters?.from_date) params.from_date = filters.from_date
        if (filters?.to_date) params.to_date = filters.to_date
        return apiGet('/expenses/claims/', params)
    },

    getClaim: async (id: string): Promise<ExpenseClaim> => {
        if (shouldBypassForSuperuser()) {
            throw new Error('Expenses are not available in public schema')
        }
        return apiGet(`/expenses/claims/${id}/`)
    },

    getMyClaims: async (): Promise<ExpenseClaim[]> => {
        if (shouldBypassForSuperuser()) return []
        return apiGet('/expenses/claims/my_claims/')
    },

    getExpenseSummary: async (year?: number): Promise<ExpenseSummary> => {
        if (shouldBypassForSuperuser()) {
            return { total_claimed: 0, total_approved: 0, total_paid: 0, claim_count: 0, by_category: [] }
        }
        const params: Record<string, string> = {}
        if (year) params.year = String(year)
        return apiGet('/expenses/claims/summary/', params)
    },

    createClaim: async (data: CreateExpenseClaimData): Promise<{ success: boolean; data: ExpenseClaim }> => {
        return apiPost('/expenses/claims/', data)
    },

    submitClaim: async (id: string): Promise<ExpenseClaim> => {
        return apiPost(`/expenses/claims/${id}/submit/`)
    },

    cancelClaim: async (id: string): Promise<{ status: string }> => {
        return apiPost(`/expenses/claims/${id}/cancel/`)
    },

    getPendingApprovals: async (): Promise<ExpenseClaim[]> => {
        if (shouldBypassForSuperuser()) return []
        return apiGet('/expenses/claims/pending_approvals/')
    },

    approveClaim: async (id: string, data: ApproveExpenseData): Promise<ExpenseClaim> => {
        return apiPost(`/expenses/claims/${id}/approve/`, data)
    },

    processPayment: async (id: string, data: ProcessPaymentData): Promise<ExpenseClaim> => {
        return apiPost(`/expenses/claims/${id}/pay/`, data)
    },

    // Advances
    getAdvances: async (filters?: {
        status?: string
        employee_id?: string
    }): Promise<EmployeeAdvance[]> => {
        if (shouldBypassForSuperuser()) return []
        const params: Record<string, string> = {}
        if (filters?.status) params.status = filters.status
        if (filters?.employee_id) params.employee = filters.employee_id
        return apiGet('/expenses/advances/', params)
    },

    getAdvance: async (id: string): Promise<EmployeeAdvance> => {
        if (shouldBypassForSuperuser()) {
            throw new Error('Expenses are not available in public schema')
        }
        return apiGet(`/expenses/advances/${id}/`)
    },

    getMyAdvances: async (): Promise<EmployeeAdvance[]> => {
        if (shouldBypassForSuperuser()) return []
        return apiGet('/expenses/advances/my_advances/')
    },

    getPendingAdvances: async (): Promise<EmployeeAdvance[]> => {
        if (shouldBypassForSuperuser()) return []
        return apiGet('/expenses/advances/pending/')
    },

    createAdvance: async (data: CreateAdvanceData): Promise<{ success: boolean; data: EmployeeAdvance }> => {
        return apiPost('/expenses/advances/', data)
    },

    approveAdvance: async (id: string, data: {
        action: 'approve' | 'reject'
        comments?: string
    }): Promise<EmployeeAdvance> => {
        return apiPost(`/expenses/advances/${id}/approve/`, data)
    },

    disburseAdvance: async (id: string, data: {
        disbursement_mode: 'bank_transfer' | 'cash' | 'cheque'
        disbursement_reference?: string
    }): Promise<EmployeeAdvance> => {
        return apiPost(`/expenses/advances/${id}/disburse/`, data)
    },
}
