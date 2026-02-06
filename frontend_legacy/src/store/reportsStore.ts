/**
 * Reports Store - Zustand state management
 */

import { create } from 'zustand'
import {
    reportsService,
    DashboardMetrics,
    DepartmentStats,
    AttendanceTrend,
    LeaveStats,
    HeadcountTrend,
    ReportConfig
} from '@/services/reportsService'

interface ReportsState {
    // Dashboard
    metrics: DashboardMetrics | null
    isLoadingMetrics: boolean

    // Stats
    departmentStats: DepartmentStats[]
    attendanceTrends: AttendanceTrend[]
    leaveStats: LeaveStats[]
    headcountTrends: HeadcountTrend[]
    isLoadingStats: boolean

    // Reports
    reports: ReportConfig[]
    isLoadingReports: boolean

    // Actions
    fetchDashboardMetrics: () => Promise<void>
    fetchDepartmentStats: () => Promise<void>
    fetchAttendanceTrends: (days?: number) => Promise<void>
    fetchLeaveStats: () => Promise<void>
    fetchHeadcountTrends: (months?: number) => Promise<void>
    fetchReports: () => Promise<void>
    generateReport: (id: string) => Promise<void>
    downloadReport: (id: string) => Promise<void>
    exportData: (type: string, format: 'xlsx' | 'csv', filters?: Record<string, any>) => Promise<void>
}

export const useReportsStore = create<ReportsState>((set, _get) => ({
    metrics: null,
    isLoadingMetrics: false,

    departmentStats: [],
    attendanceTrends: [],
    leaveStats: [],
    headcountTrends: [],
    isLoadingStats: false,

    reports: [],
    isLoadingReports: false,

    fetchDashboardMetrics: async () => {
        set({ isLoadingMetrics: true })
        try {
            const metrics = await reportsService.getDashboardMetrics()
            set({ metrics, isLoadingMetrics: false })
        } catch {
            set({ isLoadingMetrics: false })
        }
    },

    fetchDepartmentStats: async () => {
        set({ isLoadingStats: true })
        try {
            const departmentStats = await reportsService.getDepartmentStats()
            set({ departmentStats, isLoadingStats: false })
        } catch {
            set({ departmentStats: [], isLoadingStats: false })
        }
    },

    fetchAttendanceTrends: async (days?: number) => {
        try {
            const attendanceTrends = await reportsService.getAttendanceTrends({ days })
            set({ attendanceTrends })
        } catch {
            set({ attendanceTrends: [] })
        }
    },

    fetchLeaveStats: async () => {
        try {
            const leaveStats = await reportsService.getLeaveStats()
            set({ leaveStats })
        } catch {
            set({ leaveStats: [] })
        }
    },

    fetchHeadcountTrends: async (months?: number) => {
        try {
            const headcountTrends = await reportsService.getHeadcountTrends({ months })
            set({ headcountTrends })
        } catch {
            set({ headcountTrends: [] })
        }
    },

    fetchReports: async () => {
        set({ isLoadingReports: true })
        try {
            const reports = await reportsService.getReports()
            set({ reports, isLoadingReports: false })
        } catch {
            set({ reports: [], isLoadingReports: false })
        }
    },

    generateReport: async (id: string) => {
        await reportsService.generateReport(id)
    },

    downloadReport: async (id: string) => {
        const blob = await reportsService.downloadReport(id)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${id}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    },

    exportData: async (type: string, format: 'xlsx' | 'csv', filters?: Record<string, any>) => {
        const blob = await reportsService.exportData(type, format, filters)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `export-${type}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    },
}))
