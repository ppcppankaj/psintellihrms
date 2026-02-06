/**
 * OverviewTab - Employee basic information overview
 */

import { EmployeeDetail } from '@/services/employeeService'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

interface OverviewTabProps {
    employee: EmployeeDetail
}

export default function OverviewTab({ employee }: OverviewTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="lg:col-span-1">
                <CardContent className="text-center">
                    <Avatar
                        name={employee.user.full_name}
                        src={employee.user.avatar}
                        size="xl"
                        className="mx-auto"
                    />
                    <h2 className="mt-4 text-xl font-semibold text-surface-900 dark:text-white">
                        {employee.user.full_name}
                    </h2>
                    <p className="text-surface-500">{employee.designation?.name || 'No designation'}</p>
                    <p className="text-sm text-surface-400">{employee.department?.name}</p>

                    <div className="mt-4">
                        <StatusBadge status={employee.employment_status} />
                    </div>

                    <div className="mt-6 space-y-2 text-left">
                        <InfoRow icon={<EmailIcon />} label="Email" value={employee.user.email} />
                        <InfoRow icon={<PhoneIcon />} label="Phone" value={employee.user.phone || '—'} />
                        <InfoRow icon={<IdIcon />} label="Employee ID" value={employee.employee_id} />
                    </div>
                </CardContent>
            </Card>

            {/* Details */}
            <div className="lg:col-span-2 space-y-6">
                {/* Personal Info */}
                <Card>
                    <CardHeader title="Personal Information" />
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label="Date of Birth" value={formatDate(employee.date_of_birth)} />
                            <DetailItem label="Gender" value={capitalize(employee.gender)} />
                            <DetailItem label="Marital Status" value={capitalize(employee.marital_status)} />
                            <DetailItem label="Blood Group" value={employee.blood_group || '—'} />
                            <DetailItem label="Nationality" value={employee.nationality} />
                        </div>
                    </CardContent>
                </Card>

                {/* Employment Info */}
                <Card>
                    <CardHeader title="Employment Details" />
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label="Date of Joining" value={formatDate(employee.date_of_joining)} />
                            <DetailItem label="Employment Type" value={formatEmploymentType(employee.employment_type)} />
                            <DetailItem label="Work Mode" value={capitalize(employee.work_mode)} />
                            <DetailItem label="Notice Period" value={`${employee.notice_period_days} days`} />
                            <DetailItem label="Location" value={employee.location?.name || '—'} />
                            {employee.reporting_manager && (
                                <DetailItem
                                    label="Reporting Manager"
                                    value={employee.reporting_manager.full_name}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Identity Documents (Masked) */}
                <Card>
                    <CardHeader title="Identity Documents" />
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <DetailItem label="PAN" value={maskValue(employee.pan_number)} />
                            <DetailItem label="Aadhaar" value={maskValue(employee.aadhaar_number)} />
                            <DetailItem label="UAN" value={maskValue(employee.uan_number)} />
                            <DetailItem label="PF Number" value={employee.pf_number || '—'} />
                            <DetailItem label="ESI Number" value={employee.esi_number || '—'} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Helper components
function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                {label}
            </dt>
            <dd className="mt-1 text-sm text-surface-900 dark:text-white">
                {value || '—'}
            </dd>
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="text-surface-400">{icon}</span>
            <span className="text-surface-500">{label}:</span>
            <span className="text-surface-900 dark:text-white">{value}</span>
        </div>
    )
}

// Icons
function EmailIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    )
}

function PhoneIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    )
}

function IdIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
    )
}

// Utilities
function formatDate(date?: string): string {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

function capitalize(str?: string): string {
    if (!str) return '—'
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

function formatEmploymentType(type: string): string {
    const map: Record<string, string> = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        intern: 'Intern',
        consultant: 'Consultant',
    }
    return map[type] || type
}

function maskValue(value?: string): string {
    if (!value) return '—'
    if (value.length <= 4) return '****'
    return '****' + value.slice(-4)
}
