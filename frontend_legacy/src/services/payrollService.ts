/**
 * Payroll Service - API calls for payroll and compensation
 */

import { api } from './api'

// Types
export interface Payslip {
    id: string
    employee_id: string
    month: number
    year: number
    pay_period: string
    status: 'draft' | 'processing' | 'generated' | 'released' | 'cancelled'

    // Earnings
    basic: number
    hra: number
    special_allowance: number
    other_allowances: number
    bonus: number
    gross_earnings: number

    // Deductions
    pf_employee: number
    pf_employer: number
    esi_employee: number
    esi_employer: number
    professional_tax: number
    tds: number
    other_deductions: number
    total_deductions: number

    // Net
    net_pay: number

    // Meta
    working_days: number
    present_days: number
    lop_days: number
    generated_at?: string
    released_at?: string
}

export interface TaxDeclaration {
    id: string
    financial_year: string
    status: 'draft' | 'submitted' | 'verified' | 'locked'
    regime: 'old' | 'new'

    sections: {
        section_80c: number
        section_80d: number
        section_80g: number
        hra_exemption: number
        lta: number
        other_exemptions: number
    }

    total_declared: number
    total_verified: number
    created_at: string
    updated_at: string
}

export interface Reimbursement {
    id: string
    type: 'medical' | 'travel' | 'food' | 'phone' | 'internet' | 'other'
    amount: number
    description: string
    status: 'pending' | 'approved' | 'rejected' | 'paid'
    receipt_url?: string
    submitted_at: string
    processed_at?: string
}

export interface PayrollSummary {
    current_month_net: number
    ytd_gross: number
    ytd_tax: number
    pending_reimbursements: number
    last_salary_date?: string
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

class PayrollService {
    private basePath = '/payroll'

    // Get payslips
    async getPayslips(params?: { year?: number }): Promise<Payslip[]> {
        try {
            const response = await api.get<PaginatedResponse<Payslip>>(`${this.basePath}/payslips/`, { params })
            const data = response.data?.results || response.data
            return Array.isArray(data) ? data : []
        } catch {
            return []
        }
    }

    // Get single payslip
    async getPayslip(id: string): Promise<Payslip> {
        const response = await api.get<Payslip>(`${this.basePath}/payslips/${id}/`)
        return response.data
    }

    // Download payslip PDF
    async downloadPayslip(id: string): Promise<Blob> {
        const response = await api.get(`${this.basePath}/payslips/${id}/download/`, {
            responseType: 'blob'
        })
        return response.data
    }

    // Get payroll summary
    async getSummary(): Promise<PayrollSummary | null> {
        try {
            const response = await api.get<PayrollSummary>(`${this.basePath}/payslips/summary/`)
            return response.data
        } catch {
            return null
        }
    }

    // Tax declarations
    async getTaxDeclarations(): Promise<TaxDeclaration[]> {
        try {
            const response = await api.get<PaginatedResponse<TaxDeclaration>>(`${this.basePath}/tax-declarations/`)
            const data = response.data?.results || response.data
            return Array.isArray(data) ? data : []
        } catch {
            return []
        }
    }

    async getTaxDeclaration(id: string): Promise<TaxDeclaration> {
        const response = await api.get<TaxDeclaration>(`${this.basePath}/tax-declarations/${id}/`)
        return response.data
    }

    async updateTaxDeclaration(id: string, data: Partial<TaxDeclaration>): Promise<TaxDeclaration> {
        const response = await api.patch<TaxDeclaration>(`${this.basePath}/tax-declarations/${id}/`, data)
        return response.data
    }

    async submitTaxDeclaration(id: string): Promise<TaxDeclaration> {
        const response = await api.post<TaxDeclaration>(`${this.basePath}/tax-declarations/${id}/submit/`)
        return response.data
    }

    // Reimbursements
    async getReimbursements(): Promise<Reimbursement[]> {
        try {
            const response = await api.get<PaginatedResponse<Reimbursement>>(`${this.basePath}/reimbursements/`)
            const data = response.data?.results || response.data
            return Array.isArray(data) ? data : []
        } catch {
            return []
        }
    }

    async createReimbursement(data: FormData): Promise<Reimbursement> {
        const response = await api.post<Reimbursement>(`${this.basePath}/reimbursements/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    }

    async deleteReimbursement(id: string): Promise<void> {
        await api.delete(`${this.basePath}/reimbursements/${id}/`)
    }

    // Salary Structure
    async calculateStructure(annualCtc: number): Promise<SalaryBreakdown> {
        const response = await api.post<SalaryBreakdown>(`${this.basePath}/compensations/calculate-structure/`, {
            annual_ctc: annualCtc
        })
        return response.data
    }

    async getMyCompensation(): Promise<EmployeeCompensation> {
        const response = await api.get<EmployeeCompensation>(`${this.basePath}/compensations/my-compensation/`)
        return response.data
    }

    // Admin: Get by Employee ID
    async getCompensationByEmployee(employeeId: string): Promise<EmployeeCompensation | null> {
        try {
            // Prefer current compensation; fall back to latest by effective_from
            const response = await api.get<PaginatedResponse<EmployeeCompensation>>(`${this.basePath}/compensations/`, {
                params: { employee: employeeId, is_current: true, ordering: '-effective_from' }
            })
            const results = response.data?.results || response.data || []
            if (Array.isArray(results) && results.length > 0) {
                return results[0]
            }

            // Fallback: fetch latest if backend did not honor is_current
            const fallback = await api.get<PaginatedResponse<EmployeeCompensation>>(`${this.basePath}/compensations/`, {
                params: { employee: employeeId, ordering: '-effective_from' }
            })
            const fbResults = fallback.data?.results || fallback.data || []
            return Array.isArray(fbResults) && fbResults.length > 0 ? fbResults[0] : null
        } catch {
            return null
        }
    }

    // Admin: Get All Compensations
    async getAllCompensations(): Promise<EmployeeCompensation[]> {
        const response = await api.get<PaginatedResponse<EmployeeCompensation>>(`${this.basePath}/compensations/`)
        const data = response.data?.results || response.data
        return Array.isArray(data) ? data : []
    }

    // Admin: Save Compensation
    async saveCompensation(data: any): Promise<EmployeeCompensation> {
        return (await api.post<EmployeeCompensation>(`${this.basePath}/compensations/`, data)).data
    }

    // Admin: Update Compensation
    async updateCompensation(id: string, data: any): Promise<EmployeeCompensation> {
        return (await api.patch<EmployeeCompensation>(`${this.basePath}/compensations/${id}/`, data)).data
    }
}

export interface SalaryBreakdown {
    annual_ctc: number
    monthly_ctc: number
    components: {
        code: string
        name: string
        type: 'earning' | 'deduction' | 'statutory'
        monthly: number
        annual: number
    }[]
}

export interface EmployeeCompensation {
    id: string
    annual_ctc: number
    monthly_gross: number
    effective_from: string
    structure_name: string
    components: {
        id: string
        component_name: string
        component_code: string
        monthly_amount: number
        annual_amount: number
    }[]
}

export const payrollService = new PayrollService()
