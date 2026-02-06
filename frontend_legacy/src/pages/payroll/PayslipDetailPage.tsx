/**
 * PayslipDetailPage - View single payslip details
 */

import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePayrollStore } from '@/store/payrollStore'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function PayslipDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { currentPayslip, isLoadingPayslips, fetchPayslip, downloadPayslip, clearCurrentPayslip } = usePayrollStore()

    useEffect(() => {
        if (id) {
            fetchPayslip(id)
        }
        return () => clearCurrentPayslip()
    }, [id, fetchPayslip, clearCurrentPayslip])

    if (isLoadingPayslips) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!currentPayslip) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Payslip not found</h2>
                <Link to="/payroll/payslips" className="inline-block mt-4 text-primary-600 hover:text-primary-700">
                    ← Back to Payslips
                </Link>
            </div>
        )
    }

    const payslip = currentPayslip

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-surface-500">
                <Link to="/payroll/payslips" className="hover:text-primary-600">Payslips</Link>
                <span>/</span>
                <span className="text-surface-900 dark:text-white">{payslip.pay_period}</span>
            </nav>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        {monthNames[payslip.month - 1]} {payslip.year} Payslip
                    </h1>
                    <p className="text-surface-500 mt-1">
                        Pay Period: {payslip.pay_period}
                    </p>
                </div>
                {payslip.status === 'released' && (
                    <button
                        onClick={() => downloadPayslip(payslip.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <DownloadIcon />
                        Download PDF
                    </button>
                )}
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <StatCard label="Working Days" value={payslip.working_days} />
                <StatCard label="Present Days" value={payslip.present_days} />
                <StatCard label="LOP Days" value={payslip.lop_days} highlight={payslip.lop_days > 0} />
                <StatCard label="Status" value={<Badge variant="success">{payslip.status}</Badge>} />
                {payslip.released_at && (
                    <StatCard label="Released" value={formatDate(payslip.released_at)} />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings */}
                <Card>
                    <CardHeader title="Earnings" />
                    <CardContent>
                        <div className="space-y-3">
                            <Row label="Basic Salary" value={formatCurrency(payslip.basic)} />
                            <Row label="HRA" value={formatCurrency(payslip.hra)} />
                            <Row label="Special Allowance" value={formatCurrency(payslip.special_allowance)} />
                            {payslip.other_allowances > 0 && (
                                <Row label="Other Allowances" value={formatCurrency(payslip.other_allowances)} />
                            )}
                            {payslip.bonus > 0 && (
                                <Row label="Bonus" value={formatCurrency(payslip.bonus)} />
                            )}
                            <div className="pt-3 mt-3 border-t border-surface-200 dark:border-surface-700">
                                <Row label="Gross Earnings" value={formatCurrency(payslip.gross_earnings)} bold />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Deductions */}
                <Card>
                    <CardHeader title="Deductions" />
                    <CardContent>
                        <div className="space-y-3">
                            <Row label="PF (Employee)" value={formatCurrency(payslip.pf_employee)} />
                            <Row label="ESI (Employee)" value={formatCurrency(payslip.esi_employee)} />
                            <Row label="Professional Tax" value={formatCurrency(payslip.professional_tax)} />
                            <Row label="TDS" value={formatCurrency(payslip.tds)} />
                            {payslip.other_deductions > 0 && (
                                <Row label="Other Deductions" value={formatCurrency(payslip.other_deductions)} />
                            )}
                            <div className="pt-3 mt-3 border-t border-surface-200 dark:border-surface-700">
                                <Row label="Total Deductions" value={formatCurrency(payslip.total_deductions)} bold />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Net Pay */}
            <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-primary-600 dark:text-primary-400">Net Payable</p>
                            <p className="text-3xl font-bold text-primary-700 dark:text-primary-300">
                                {formatCurrency(payslip.net_pay)}
                            </p>
                        </div>
                        <div className="text-right text-sm text-primary-600 dark:text-primary-400">
                            <p>Employer Contributions:</p>
                            <p>PF: {formatCurrency(payslip.pf_employer)} | ESI: {formatCurrency(payslip.esi_employer)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
    return (
        <Card padding="sm">
            <CardContent>
                <p className="text-xs text-surface-500 uppercase tracking-wide">{label}</p>
                <p className={`text-lg font-semibold mt-1 ${highlight ? 'text-red-600' : 'text-surface-900 dark:text-white'}`}>
                    {value}
                </p>
            </CardContent>
        </Card>
    )
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className={bold ? 'font-medium text-surface-900 dark:text-white' : 'text-surface-500'}>
                {label}
            </span>
            <span className={bold ? 'font-semibold text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}>
                {value}
            </span>
        </div>
    )
}

function DownloadIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    )
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
