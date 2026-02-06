import api from './index';
import type { PaginatedResponse } from './types';

export interface PayrollRun {
    id: string;
    name: string;
    month: number;
    year: number;
    status: 'draft' | 'processing' | 'processed' | 'pending_approval' | 'approved' | 'locked' | 'paid';
    total_employees: number;
    total_gross: string;
    total_net: string;
    pay_date: string;
}

export interface Payslip {
    id: string;
    employee: string;
    payroll_run: string;
    gross_salary: string;
    total_deductions: string;
    net_salary: string;
    pdf_file: string | null;
}

export const payrollService = {
    getPayrollRuns: async (params?: any) => {
        const response = await api.get<PaginatedResponse<PayrollRun>>('/payroll/runs/', { params });
        return response.data;
    },
    createPayrollRun: async (data: Partial<PayrollRun>) => {
        const response = await api.post<PayrollRun>('/payroll/runs/', data);
        return response.data;
    },
    processPayroll: async (id: string) => {
        const response = await api.post<PayrollRun>(`/payroll/runs/${id}/process/`);
        return response.data;
    },
    approvePayroll: async (id: string) => {
        const response = await api.post<PayrollRun>(`/payroll/runs/${id}/approve/`);
        return response.data;
    },
    getPayslips: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Payslip>>('/payroll/payslips/', { params });
        return response.data;
    },
    getReimbursements: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/payroll/reimbursements/', { params });
        return response.data;
    },
    getTaxDeclarations: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/payroll/tax-declarations/', { params });
        return response.data;
    }
};
