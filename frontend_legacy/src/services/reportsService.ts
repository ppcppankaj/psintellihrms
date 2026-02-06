/**
 * Reports Service - API calls for reports and analytics
 * 
 * Backend endpoints:
 * - GET /reports/dashboard-metrics/ - HR dashboard metrics
 * - GET /reports/department-stats/ - Employee count by department
 * - GET /reports/leave-stats/ - Leave utilization stats
 * - GET /reports/attrition/ - Attrition report
 */

import { api } from './api'

// Types
export interface DashboardMetrics {
    total_employees: number
    active_employees: number
    on_leave_today: number
    pending_approvals: number
    new_hires_this_month: number
    attrition_this_month: number
    avg_attendance_percent: number
    open_positions: number
}

export interface DepartmentStats {
    department: string
    department_id?: string
    employee_count: number
    avg_tenure_months: number
    open_positions: number
    attrition_rate: number
}

export interface AttendanceTrend {
    date: string
    present: number
    absent: number
    on_leave: number
    attendance_percent: number
}

export interface LeaveStats {
    leave_type: string
    leave_type_id?: string
    total_taken: number
    total_balance: number
    utilization_percent: number
}

export interface HeadcountTrend {
    month: string
    headcount: number
    new_hires: number
    exits: number
}

export interface AttritionData {
    month: string
    voluntary_exits: number
    involuntary_exits: number
    total_exits: number
    attrition_rate: number
}

export interface ReportConfig {
    id: string
    name: string
    type: 'attendance' | 'leave' | 'payroll' | 'headcount' | 'custom'
    status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed'
    schedule?: string
    last_run?: string
    format: 'pdf' | 'xlsx' | 'csv'
}

/**
 * Normalize response data - handles both paginated and direct responses
 */
const normalizeArrayResponse = <T>(data: any): T[] => {
    if (Array.isArray(data)) return data
    if (data?.results && Array.isArray(data.results)) return data.results
    if (data?.data && Array.isArray(data.data)) return data.data
    return []
}

class ReportsService {
    private basePath = '/reports'

    // Dashboard metrics
    async getDashboardMetrics(): Promise<DashboardMetrics> {
        const response = await api.get<any>(`${this.basePath}/dashboard-metrics/`)
        return response.data?.data || response.data
    }

    // Department statistics
    async getDepartmentStats(): Promise<DepartmentStats[]> {
        const response = await api.get<any>(`${this.basePath}/department-stats/`)
        return normalizeArrayResponse(response.data)
    }

    // Attendance trends
    async getAttendanceTrends(params?: { days?: number; start_date?: string; end_date?: string }): Promise<AttendanceTrend[]> {
        const response = await api.get<any>(`${this.basePath}/attendance-trends/`, { params })
        return normalizeArrayResponse(response.data)
    }

    // Leave statistics
    async getLeaveStats(params?: { year?: number }): Promise<LeaveStats[]> {
        const response = await api.get<any>(`${this.basePath}/leave-stats/`, { params })
        return normalizeArrayResponse(response.data)
    }

    // Headcount trends
    async getHeadcountTrends(params?: { months?: number }): Promise<HeadcountTrend[]> {
        const response = await api.get<any>(`${this.basePath}/headcount-trends/`, { params })
        return normalizeArrayResponse(response.data)
    }

    // Attrition report
    async getAttritionReport(params?: { months?: number; year?: number }): Promise<AttritionData[]> {
        const response = await api.get<any>(`${this.basePath}/attrition/`, { params })
        return normalizeArrayResponse(response.data)
    }

    // Report configurations
    async getReports(): Promise<ReportConfig[]> {
        const response = await api.get<any>(`${this.basePath}/configurations/`)
        return normalizeArrayResponse(response.data)
    }

    // Generate report
    async generateReport(reportId: string): Promise<{ success: boolean; message: string }> {
        const response = await api.post(`${this.basePath}/configurations/${reportId}/generate/`)
        return response.data
    }

    // Download report
    async downloadReport(reportId: string): Promise<Blob> {
        const response = await api.get(`${this.basePath}/configurations/${reportId}/download/`, {
            responseType: 'blob'
        })
        return response.data
    }

    // Export data
    async exportData(type: string, format: 'xlsx' | 'csv', filters?: Record<string, any>): Promise<Blob> {
        const response = await api.post(`${this.basePath}/export/`,
            { type, format, filters },
            { responseType: 'blob' }
        )
        return response.data
    }
}

export const reportsService = new ReportsService()
