/**
 * Report Service - API for reports, analytics, exports
 */
import api from './index';
import type { PaginatedResponse } from './types';

export interface ReportDefinition {
    id: string;
    name: string;
    code: string;
    description?: string;
    category: 'hr' | 'payroll' | 'attendance' | 'performance' | 'recruitment' | 'finance';
    is_system: boolean;
    parameters?: ReportParameter[];
}

export interface ReportParameter {
    name: string;
    label: string;
    type: 'date' | 'daterange' | 'select' | 'multiselect' | 'text';
    required: boolean;
    options?: { value: string; label: string }[];
}

export interface ReportExecution {
    id: string;
    report: string;
    report_name?: string;
    parameters: Record<string, unknown>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    file_url?: string;
    format: 'pdf' | 'csv' | 'xlsx';
    created_at: string;
    completed_at?: string;
    error_message?: string;
}

export interface DashboardMetric {
    label: string;
    value: number | string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
}

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        color?: string;
    }[];
}

export const reportService = {
    // Report Definitions
    getReports: async (category?: string) => {
        const params = category ? { category } : {};
        const response = await api.get<PaginatedResponse<ReportDefinition>>('/reports/', { params });
        return response.data;
    },
    getReport: async (id: string) => {
        const response = await api.get<ReportDefinition>(`/reports/${id}/`);
        return response.data;
    },

    // Execute Reports
    executeReport: async (reportId: string, parameters: Record<string, unknown>, format: string = 'pdf') => {
        const response = await api.post<ReportExecution>('/reports/execute/', {
            report: reportId,
            parameters,
            format
        });
        return response.data;
    },
    getExecutions: async (reportId?: string) => {
        const params = reportId ? { report: reportId } : {};
        const response = await api.get<PaginatedResponse<ReportExecution>>('/reports/executions/', { params });
        return response.data;
    },
    downloadExecution: async (id: string) => {
        const response = await api.get(`/reports/executions/${id}/download/`, { responseType: 'blob' });
        return response.data;
    },

    // Dashboard Analytics
    getHeadcountMetrics: async (params?: Record<string, unknown>) => {
        const response = await api.get<{ metrics: DashboardMetric[]; charts: Record<string, ChartData> }>(
            '/reports/analytics/headcount/', { params }
        );
        return response.data;
    },
    getAttendanceMetrics: async (params?: Record<string, unknown>) => {
        const response = await api.get<{ metrics: DashboardMetric[]; charts: Record<string, ChartData> }>(
            '/reports/analytics/attendance/', { params }
        );
        return response.data;
    },
    getPayrollMetrics: async (params?: Record<string, unknown>) => {
        const response = await api.get<{ metrics: DashboardMetric[]; charts: Record<string, ChartData> }>(
            '/reports/analytics/payroll/', { params }
        );
        return response.data;
    },
    getAttritionMetrics: async (params?: Record<string, unknown>) => {
        const response = await api.get<{ metrics: DashboardMetric[]; charts: Record<string, ChartData> }>(
            '/reports/analytics/attrition/', { params }
        );
        return response.data;
    },

    // Quick Exports
    exportData: async (entity: string, format: 'csv' | 'xlsx' = 'csv', filters?: Record<string, unknown>) => {
        const response = await api.post('/reports/export/', { entity, format, filters }, { responseType: 'blob' });
        return response.data;
    }
};
