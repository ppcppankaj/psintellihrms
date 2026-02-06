/**
 * PayslipCard Component - Display payslip in list
 */

import { Link } from 'react-router-dom'
import { Payslip } from '@/services/payrollService'
import Badge from '@/components/ui/Badge'
import { usePayrollStore } from '@/store/payrollStore'

interface PayslipCardProps {
    payslip: Payslip
}

const statusConfig: Record<string, { variant: 'default' | 'warning' | 'success' | 'error'; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    processing: { variant: 'warning', label: 'Processing' },
    generated: { variant: 'success', label: 'Generated' },
    released: { variant: 'success', label: 'Released' },
    cancelled: { variant: 'error', label: 'Cancelled' },
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function PayslipCard({ payslip }: PayslipCardProps) {
    const { downloadPayslip } = usePayrollStore()
    const status = statusConfig[payslip.status] || statusConfig.draft

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        await downloadPayslip(payslip.id)
    }

    return (
        <Link
            to={`/payroll/payslips/${payslip.id}`}
            className="block bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-4 hover:shadow-md hover:border-surface-300 dark:hover:border-surface-600 transition-all"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Month indicator */}
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                            {monthNames[payslip.month - 1]}
                        </span>
                        <span className="text-lg font-bold text-primary-700 dark:text-primary-300">
                            {payslip.year.toString().slice(-2)}
                        </span>
                    </div>

                    {/* Details */}
                    <div>
                        <p className="font-medium text-surface-900 dark:text-white">
                            {payslip.pay_period}
                        </p>
                        <p className="text-sm text-surface-500 mt-0.5">
                            {payslip.present_days}/{payslip.working_days} days worked
                            {payslip.lop_days > 0 && (
                                <span className="text-red-500 ml-2">• {payslip.lop_days} LOP</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Net pay */}
                    <div className="text-right">
                        <p className="text-sm text-surface-500">Net Pay</p>
                        <p className="text-lg font-semibold text-surface-900 dark:text-white">
                            {formatCurrency(payslip.net_pay)}
                        </p>
                    </div>

                    {/* Status */}
                    <Badge variant={status.variant} size="sm">
                        {status.label}
                    </Badge>

                    {/* Download button */}
                    {payslip.status === 'released' && (
                        <button
                            onClick={handleDownload}
                            className="p-2 text-surface-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Download PDF"
                        >
                            <DownloadIcon />
                        </button>
                    )}
                </div>
            </div>
        </Link>
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
