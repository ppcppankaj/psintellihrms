/**
 * Attendance Service - Attendance API calls
 */

import { apiGet, apiPost } from './api'
import { useAuthStore } from '@/store/authStore'
import type { AttendanceRecord, PunchRequest, PunchResponse, PaginatedResponse } from '@/types'

const shouldBypassForSuperuser = () => {
    const { user, tenant, tokens } = useAuthStore.getState()
    // Avoid tenant calls before user profile is loaded
    if (!user) return true

    // Superusers should not hit tenant-scoped attendance APIs at all
    if (user.is_superuser) return true

    // No tokens or superuser on public schema should not call tenant-scoped APIs
    const isPublicSuper = Boolean(
        user?.is_superuser && (
            !tenant ||
            (tenant as any)?.is_public ||
            (tenant as any)?.slug === 'public'
        )
    )
    return isPublicSuper || !tokens?.access
}

export interface AttendanceSummary {
    total_days: number
    present_days: number
    absent_days: number
    late_days: number
    half_days: number
    leave_days: number
    wfh_days: number
    total_hours: number
    overtime_hours: number
    average_hours_per_day: number
}

export interface TeamAttendance {
    employee_id: string
    employee_name: string
    avatar?: string
    status: string
    check_in?: string
    check_out?: string
}

export const attendanceService = {
    /**
     * Punch in
     */
    punchIn: async (data: PunchRequest): Promise<PunchResponse> => {
        return apiPost<PunchResponse>('/attendance/records/punch_in/', data)
    },

    /**
     * Punch out
     */
    punchOut: async (data: PunchRequest): Promise<PunchResponse> => {
        return apiPost<PunchResponse>('/attendance/records/punch_out/', data)
    },

    /**
     * Get today's attendance status
     */
    getMyToday: async (): Promise<AttendanceRecord | { status: 'not_punched' }> => {
        if (shouldBypassForSuperuser()) {
            return { status: 'not_punched' }
        }
        return apiGet('/attendance/records/my_today/')
    },

    /**
     * Get attendance summary
     */
    getMySummary: async (startDate?: string, endDate?: string): Promise<AttendanceSummary> => {
        if (shouldBypassForSuperuser()) {
            return {
                total_days: 0,
                present_days: 0,
                absent_days: 0,
                late_days: 0,
                half_days: 0,
                leave_days: 0,
                wfh_days: 0,
                total_hours: 0,
                overtime_hours: 0,
                average_hours_per_day: 0,
            }
        }
        const params: Record<string, string> = {}
        if (startDate) params.start_date = startDate
        if (endDate) params.end_date = endDate
        return apiGet('/attendance/records/my_summary/', params)
    },

    /**
     * Get team attendance for today
     */
    getTeamToday: async (): Promise<TeamAttendance[]> => {
        if (shouldBypassForSuperuser()) {
            return []
        }
        return apiGet('/attendance/records/team_today/')
    },

    /**
     * Get attendance records with pagination
     */
    getRecords: async (params: {
        page?: number
        employee?: string
        start_date?: string
        end_date?: string
        status?: string
    }): Promise<PaginatedResponse<AttendanceRecord>> => {
        if (shouldBypassForSuperuser()) {
            return { count: 0, next: null, previous: null, results: [] }
        }
        return apiGet('/attendance/records/', params)
    },

    /**
     * Get single attendance record
     */
    getRecord: async (id: string): Promise<AttendanceRecord> => {
        if (shouldBypassForSuperuser()) {
            throw new Error('Attendance is not available in public schema')
        }
        return apiGet(`/attendance/records/${id}/`)
    },

    /**
     * Request regularization
     */
    regularize: async (
        id: string,
        data: { check_in?: string; check_out?: string; reason: string }
    ): Promise<{ success: boolean; message: string }> => {
        return apiPost(`/attendance/records/${id}/regularize/`, data)
    },

    /**
     * Approve regularization
     */
    approveRegularization: async (id: string): Promise<{ success: boolean; message: string }> => {
        return apiPost(`/attendance/records/${id}/approve_regularization/`)
    },

    /**
     * Get fraud dashboard stats
     */
    getFraudDashboard: async () => {
        return apiGet('/attendance/fraud-logs/dashboard/')
    },
}
