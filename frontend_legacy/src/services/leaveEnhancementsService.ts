/**
 * Leave Enhancements Service - Leave Encashment & Compensatory Leave API
 */

import { apiGet, apiPost } from './api'

// Leave Encashment
export interface LeaveEncashment {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    leave_type: string
    leave_type_name: string
    year: number
    days_requested: number
    days_approved?: number
    per_day_amount?: number
    total_amount?: number
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled'
    status_display: string
    approved_by_name?: string
    approved_at?: string
    payment_reference?: string
    rejection_reason?: string
    created_at: string
}

export interface CreateEncashmentData {
    leave_type_id: string
    year: number
    days_requested: number
}

// Compensatory Leave
export interface CompensatoryLeave {
    id: string
    employee: string
    employee_id: string
    employee_name: string
    work_date: string
    work_type: 'holiday' | 'weekend' | 'extra_hours'
    work_type_display: string
    reason: string
    days_credited: number
    expiry_date?: string
    status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired'
    status_display: string
    approved_by_name?: string
    approved_at?: string
    rejection_reason?: string
    used_in_leave_request?: string
    created_at: string
}

export interface CreateCompOffData {
    work_date: string
    work_type: 'holiday' | 'weekend' | 'extra_hours'
    reason: string
    days_credited?: number
}

// Holiday Calendar
export interface HolidayCalendar {
    id: string
    name: string
    country: string
    year: number
    is_default: boolean
    entry_count: number
}

export interface HolidayCalendarEntry {
    id: string
    calendar: string
    name: string
    date: string
    is_restricted: boolean
    description?: string
}

export const leaveEnhancementsService = {
    // Leave Encashment
    getEncashments: async (filters?: { status?: string; year?: number }): Promise<LeaveEncashment[]> => {
        const params: Record<string, string> = {}
        if (filters?.status) params.status = filters.status
        if (filters?.year) params.year = String(filters.year)
        return apiGet('/leave/encashments/', params)
    },

    getMyEncashments: async (): Promise<LeaveEncashment[]> => {
        return apiGet('/leave/encashments/my-encashments/')
    },

    createEncashment: async (data: CreateEncashmentData): Promise<LeaveEncashment> => {
        return apiPost('/leave/encashments/', data)
    },

    submitEncashment: async (id: string): Promise<LeaveEncashment> => {
        return apiPost(`/leave/encashments/${id}/submit/`)
    },

    approveEncashment: async (id: string, data: {
        action: 'approve' | 'reject'
        days_approved?: number
        rejection_reason?: string
    }): Promise<LeaveEncashment> => {
        return apiPost(`/leave/encashments/${id}/approve/`, data)
    },

    // Compensatory Leave
    getCompOffs: async (filters?: { status?: string }): Promise<CompensatoryLeave[]> => {
        const params: Record<string, string> = {}
        if (filters?.status) params.status = filters.status
        return apiGet('/leave/compensatory/', params)
    },

    getMyCompOffs: async (): Promise<CompensatoryLeave[]> => {
        return apiGet('/leave/compensatory/my_compoffs/')
    },

    createCompOff: async (data: CreateCompOffData): Promise<CompensatoryLeave> => {
        return apiPost('/leave/compensatory/', data)
    },

    approveCompOff: async (id: string, data: {
        action: 'approve' | 'reject'
        rejection_reason?: string
    }): Promise<CompensatoryLeave> => {
        return apiPost(`/leave/compensatory/${id}/approve/`, data)
    },

    // Holiday Calendars
    getCalendars: async (): Promise<HolidayCalendar[]> => {
        return apiGet('/leave/calendars/')
    },

    getCalendarEntries: async (calendarId: string): Promise<HolidayCalendarEntry[]> => {
        return apiGet(`/leave/calendars/${calendarId}/entries/`)
    },
}
