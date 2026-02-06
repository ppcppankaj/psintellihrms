/**
 * PayslipsPage - List all payslips
 */

import { useEffect, useState } from 'react'
import { usePayrollStore } from '@/store/payrollStore'
import PayslipCard from '@/components/payroll/PayslipCard'
import Card, { CardContent } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

import { useAuthStore } from '@/store/authStore'

export default function PayslipsPage() {
    const { user } = useAuthStore()
    const { payslips, summary, isLoadingPayslips, fetchPayslips, fetchSummary } = usePayrollStore()
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

    useEffect(() => {
        if (user?.employee_id) {
            fetchPayslips(selectedYear)
            fetchSummary()
        }
    }, [fetchPayslips, fetchSummary, selectedYear, user?.employee_id])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Payslips
                    </h1>
                    <p className="text-surface-500 mt-1">
                        View and download your salary slips
                    </p>
                </div>

                {/* Year filter */}
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard
                        label="Current Month Net"
                        value={formatCurrency(summary.current_month_net)}
                        color="primary"
                    />
                    <SummaryCard
                        label="YTD Gross"
                        value={formatCurrency(summary.ytd_gross)}
                        color="green"
                    />
                    <SummaryCard
                        label="YTD Tax Paid"
                        value={formatCurrency(summary.ytd_tax)}
                        color="amber"
                    />
                    <SummaryCard
                        label="Pending Reimbursements"
                        value={formatCurrency(summary.pending_reimbursements)}
                        color="purple"
                    />
                </div>
            )}

            {/* Payslips List */}
            {isLoadingPayslips ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <LoadingSpinner size="lg" />
                </div>
            ) : !payslips || payslips.length === 0 ? (
                <EmptyState year={selectedYear} />
            ) : (
                <div className="space-y-3">
                    {payslips.map((payslip) => (
                        <PayslipCard key={payslip.id} payslip={payslip} />
                    ))}
                </div>
            )}
        </div>
    )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
    const colorClasses: Record<string, string> = {
        primary: 'text-primary-600 dark:text-primary-400',
        green: 'text-green-600 dark:text-green-400',
        amber: 'text-amber-600 dark:text-amber-400',
        purple: 'text-purple-600 dark:text-purple-400',
    }

    return (
        <Card padding="sm">
            <CardContent>
                <p className="text-sm text-surface-500">{label}</p>
                <p className={`text-xl font-bold mt-1 ${colorClasses[color]}`}>
                    {value}
                </p>
            </CardContent>
        </Card>
    )
}

function EmptyState({ year }: { year: number }) {
    return (
        <Card>
            <CardContent className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
                    No payslips for {year}
                </h3>
                <p className="mt-1 text-sm text-surface-500">
                    Payslips will appear here once processed.
                </p>
            </CardContent>
        </Card>
    )
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}
