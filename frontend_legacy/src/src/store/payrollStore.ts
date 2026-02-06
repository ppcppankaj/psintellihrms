/**
 * Payroll Store - Zustand state management
 */

import { create } from 'zustand'
import {
    payrollService,
    Payslip,
    TaxDeclaration,
    Reimbursement,
    PayrollSummary
} from '@/services/payrollService'

interface PayrollState {
    // Payslips
    payslips: Payslip[]
    currentPayslip: Payslip | null
    isLoadingPayslips: boolean

    // Summary
    summary: PayrollSummary | null

    // Tax
    taxDeclarations: TaxDeclaration[]
    currentTaxDeclaration: TaxDeclaration | null
    isLoadingTax: boolean

    // Reimbursements
    reimbursements: Reimbursement[]
    isLoadingReimbursements: boolean

    // Actions
    fetchPayslips: (year?: number) => Promise<void>
    fetchPayslip: (id: string) => Promise<void>
    downloadPayslip: (id: string) => Promise<void>
    fetchSummary: () => Promise<void>
    fetchTaxDeclarations: () => Promise<void>
    fetchTaxDeclaration: (id: string) => Promise<void>
    updateTaxDeclaration: (id: string, data: Partial<TaxDeclaration>) => Promise<void>
    submitTaxDeclaration: (id: string) => Promise<void>
    fetchReimbursements: () => Promise<void>
    createReimbursement: (data: FormData) => Promise<void>
    deleteReimbursement: (id: string) => Promise<void>
    clearCurrentPayslip: () => void
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
    payslips: [],
    currentPayslip: null,
    isLoadingPayslips: false,

    summary: null,

    taxDeclarations: [],
    currentTaxDeclaration: null,
    isLoadingTax: false,

    reimbursements: [],
    isLoadingReimbursements: false,

    fetchPayslips: async (year?: number) => {
        set({ isLoadingPayslips: true })
        try {
            const payslips = await payrollService.getPayslips({ year })
            set({ payslips, isLoadingPayslips: false })
        } catch {
            set({ payslips: [], isLoadingPayslips: false })
        }
    },

    fetchPayslip: async (id: string) => {
        set({ isLoadingPayslips: true })
        try {
            const payslip = await payrollService.getPayslip(id)
            set({ currentPayslip: payslip, isLoadingPayslips: false })
        } catch {
            set({ currentPayslip: null, isLoadingPayslips: false })
        }
    },

    downloadPayslip: async (id: string) => {
        const blob = await payrollService.downloadPayslip(id)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payslip-${id}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    },

    fetchSummary: async () => {
        try {
            const summary = await payrollService.getSummary()
            set({ summary })
        } catch {
            // Silently fail
        }
    },

    fetchTaxDeclarations: async () => {
        set({ isLoadingTax: true })
        try {
            const taxDeclarations = await payrollService.getTaxDeclarations()
            set({ taxDeclarations, isLoadingTax: false })
        } catch {
            set({ taxDeclarations: [], isLoadingTax: false })
        }
    },

    fetchTaxDeclaration: async (id: string) => {
        set({ isLoadingTax: true })
        try {
            const declaration = await payrollService.getTaxDeclaration(id)
            set({ currentTaxDeclaration: declaration, isLoadingTax: false })
        } catch {
            set({ currentTaxDeclaration: null, isLoadingTax: false })
        }
    },

    updateTaxDeclaration: async (id: string, data) => {
        const updated = await payrollService.updateTaxDeclaration(id, data)
        set({ currentTaxDeclaration: updated })
        await get().fetchTaxDeclarations()
    },

    submitTaxDeclaration: async (id: string) => {
        const updated = await payrollService.submitTaxDeclaration(id)
        set({ currentTaxDeclaration: updated })
        await get().fetchTaxDeclarations()
    },

    fetchReimbursements: async () => {
        set({ isLoadingReimbursements: true })
        try {
            const reimbursements = await payrollService.getReimbursements()
            set({ reimbursements, isLoadingReimbursements: false })
        } catch {
            set({ reimbursements: [], isLoadingReimbursements: false })
        }
    },

    createReimbursement: async (data: FormData) => {
        await payrollService.createReimbursement(data)
        await get().fetchReimbursements()
    },

    deleteReimbursement: async (id: string) => {
        await payrollService.deleteReimbursement(id)
        await get().fetchReimbursements()
    },

    clearCurrentPayslip: () => {
        set({ currentPayslip: null })
    },
}))
