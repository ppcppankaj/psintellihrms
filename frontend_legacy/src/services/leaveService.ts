/**
 * Leave Service - Leave API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api'

export interface LeaveType {
    id: string
    name: string
    code: string
    color: string
    annual_quota: number
    is_paid: boolean
    requires_approval: boolean
    requires_attachment: boolean
}

export interface LeavePolicy {
    id: string
    name: string
    description: string
    sandwich_rule: boolean
    probation_leave_allowed: boolean
    negative_balance_allowed: boolean
    max_negative_balance: number
    count_holidays: boolean
    count_weekends: boolean
    is_active: boolean
}

export interface LeaveBalance {
    leave_type_id: string
    leave_type_name: string
    leave_type_code: string
    color: string
    opening_balance: number
    accrued: number
    taken: number
    carry_forward: number
    adjustment: number
    available: number
}

export interface LeaveRequest {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    leave_type: string
    leave_type_name: string
    color: string
    start_date: string
    end_date: string
    start_day_type: 'full' | 'first_half' | 'second_half'
    end_day_type: 'full' | 'first_half' | 'second_half'
    total_days: number
    reason: string
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    created_at: string
}

export interface LeaveApplyData {
    leave_type: string
    start_date: string
    end_date: string
    start_day_type?: 'full' | 'first_half' | 'second_half'
    end_day_type?: 'full' | 'first_half' | 'second_half'
    reason: string
    contact_number?: string
    contact_address?: string
}

export interface LeaveCalculation {
    total_days: number
    leave_dates: string[]
    weekends_excluded: string[]
    holidays_excluded: string[]
}

export interface Holiday {
    id: string
    name: string
    date: string
    is_optional: boolean
}

export interface TeamLeave {
    employee_id: string
    employee_name: string
    avatar?: string
    leave_type: string
    color: string
    start_date: string
    end_date: string
    status: string
}

export const leaveService = {
    /**
     * Get leave types
     */
    getLeaveTypes: async (): Promise<LeaveType[]> => {
        const data = await apiGet<any>('/leave/types/')
        if (Array.isArray(data)) return data
        if (Array.isArray(data?.results)) return data.results
        if (Array.isArray(data?.data)) return data.data
        return []
    },

    /**
     * Get my leave balance
     */
    getMyBalance: async (year?: number): Promise<LeaveBalance[]> => {
        const params: Record<string, string> = {}
        if (year) params.year = String(year)
        return apiGet('/leave/requests/my_balance/', params)
    },

    /**
     * Get my leave requests
     */
    getMyRequests: async (status?: string): Promise<LeaveRequest[]> => {
        const params: Record<string, string> = {}
        if (status) params.status = status
        return apiGet('/leave/requests/my_requests/', params)
    },

    /**
     * Calculate leave days (preview)
     */
    calculateDays: async (data: {
        start_date: string
        end_date: string
        start_day_type?: string
        end_day_type?: string
    }): Promise<LeaveCalculation> => {
        return apiPost('/leave/requests/calculate/', data)
    },

    /**
     * Apply for leave
     */
    apply: async (data: LeaveApplyData): Promise<{ success: boolean; message: string; data: LeaveRequest }> => {
        return apiPost('/leave/requests/apply/', data)
    },

    /**
     * Cancel leave request
     */
    cancel: async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
        return apiPost(`/leave/requests/${id}/cancel/`, { reason })
    },

    /**
     * Get pending approvals
     */
    getPendingApprovals: async (): Promise<LeaveRequest[]> => {
        return apiGet('/leave/requests/pending_approvals/')
    },

    /**
     * Approve leave request
     */
    approve: async (id: string, comments?: string): Promise<{ success: boolean; message: string }> => {
        return apiPost(`/leave/requests/${id}/approve/`, { action: 'approve', comments })
    },

    /**
     * Reject leave request
     */
    reject: async (id: string, comments?: string): Promise<{ success: boolean; message: string }> => {
        return apiPost(`/leave/requests/${id}/approve/`, { action: 'reject', comments })
    },

    /**
     * Get team leaves for calendar
     */
    getTeamLeaves: async (fromDate: string, toDate: string): Promise<TeamLeave[]> => {
        return apiGet('/leave/requests/team_leaves/', {
            from_date: fromDate,
            to_date: toDate,
        })
    },

    /**
     * Get holidays
     */
    getHolidays: async (year?: number): Promise<Holiday[]> => {
        const params: Record<string, string> = {}
        if (year) params.year = String(year)
        return apiGet('/leave/holidays/by_year/', params)
    },

    /**
     * Get upcoming holidays
     */
    getUpcomingHolidays: async (count: number = 5): Promise<Holiday[]> => {
        return apiGet('/leave/holidays/upcoming/', { count: String(count) })
    },

    /**
     * Get all balances (Admin)
     */
    getAllBalances: async (year?: number, employeeId?: string): Promise<LeaveBalance[]> => {
        const params: Record<string, string> = {}
        if (year) params.year = String(year)
        if (employeeId) params.employee = employeeId
        return apiGet('/leave/balances/', params) // Using generic ModelViewSet list
    },

    // --- Leave Policies ---
    getPolicies: async (): Promise<LeavePolicy[]> => {
        return apiGet('/leave/policies/')
    },

    createPolicy: async (data: Partial<LeavePolicy>): Promise<LeavePolicy> => {
        return apiPost('/leave/policies/', data)
    },

    updatePolicy: async (id: string, data: Partial<LeavePolicy>): Promise<LeavePolicy> => {
        return apiPut(`/leave/policies/${id}/`, data) // Using POST/PUT depending on backend, typically PUT/PATCH but ModelViewSet supports both. Assuming standard DRF.
        // Wait, standard DRF uses PUT/PATCH for update. My api helper might have apiPut?
        // Checking existing service code... yes, expenseService uses apiPut.
        // I should use apiPut here if possible, but let me check if apiPut is imported.
        // It is NOT imported in leaveService.ts currently.
        // I will add apiPut to imports first.
    },

    deletePolicy: async (id: string): Promise<void> => {
        // apiDelete is also needed.
        // I will update imports in a separate call or just use apiPost if I can't see apiDelete.
        // expenseService has apiDelete.
        // I will assume apiPut and apiDelete are available in ./api and import them.
        return apiDelete(`/leave/policies/${id}/`) // Placeholder until I fix imports
    }
}
// Wait, I can't see imports in this view.
// I will start by adding the INTERFACE and generic methods, then fix imports.
