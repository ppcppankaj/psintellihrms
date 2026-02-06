import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import EnterpriseTable, { Column, PaginatedData, TableState } from '@/components/ui/EnterpriseTable'
import { api, apiUpload } from '@/services/api'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import BulkUploadModal from '@/components/ui/BulkUploadModal'

interface AdminField {
    name: string
    label: string
    type: string
    required?: boolean
    choices?: { value: string; display_name: string }[]
    read_only?: boolean
}

// Generic Form Modal Component
interface GenericFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: Record<string, unknown>) => Promise<void>
    title: string
    initialData?: Record<string, unknown> | null
    fields: AdminField[]
}

function GenericFormModal({ isOpen, onClose, onSave, title, initialData, fields }: GenericFormModalProps) {
    const [formData, setFormData] = useState<Record<string, unknown>>({})
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {})
        }
    }, [initialData, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error('Save failed:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        {fields.map(field => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    {field.label}
                                </label>
                                {field.type === 'boolean' ? (
                                    <input
                                        type="checkbox"
                                        checked={(formData[field.name] as boolean) || false}
                                        onChange={e => setFormData({ ...formData, [field.name]: e.target.checked })}
                                        className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                    />
                                ) : (field.type === 'choice' || field.type === 'field') && field.choices ? (
                                    <select
                                        value={(formData[field.name] as string) || ''}
                                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-primary-500"
                                        required={field.required}
                                    >
                                        <option value="">Select {field.label}</option>
                                        {field.choices.map((choice) => (
                                            <option key={choice.value} value={choice.value}>
                                                {choice.display_name}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        value={(formData[field.name] as string) || ''}
                                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-primary-500"
                                        rows={3}
                                    />
                                ) : (
                                    <input
                                        type={field.type === 'integer' || field.type === 'decimal' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : field.type === 'time' ? 'time' : 'text'}
                                        step={field.type === 'decimal' ? '0.01' : '1'}
                                        value={(formData[field.name] as string | number) || ''}
                                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-primary-500"
                                        required={field.required}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function AdminModulePage({ category: propCategory, module: propModule }: { category?: string; module?: string }) {
    const params = useParams<{ category: string; module: string }>()
    const category = propCategory || params.category
    const module = propModule || params.module
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null)
    const [metadata, setMetadata] = useState<AdminField[]>([])
    const [refreshKey, setRefreshKey] = useState(0)
    const [extraChoices, setExtraChoices] = useState<Record<string, { value: string; display_name: string }[]>>({
        country: [
            { value: 'India', display_name: 'India' },
            { value: 'United States', display_name: 'United States' },
            { value: 'United Kingdom', display_name: 'United Kingdom' },
            { value: 'Singapore', display_name: 'Singapore' },
            { value: 'United Arab Emirates', display_name: 'United Arab Emirates' },
            { value: 'Australia', display_name: 'Australia' },
            { value: 'Canada', display_name: 'Canada' },
            { value: 'Germany', display_name: 'Germany' },
        ],
        timezone: [
            { value: 'Asia/Kolkata', display_name: 'India Standard Time (IST)' },
            { value: 'UTC', display_name: 'Coordinated Universal Time (UTC)' },
            { value: 'America/New_York', display_name: 'Eastern Time (ET)' },
            { value: 'America/Los_Angeles', display_name: 'Pacific Time (PT)' },
            { value: 'Europe/London', display_name: 'Greenwich Mean Time (GMT)' },
            { value: 'Asia/Dubai', display_name: 'Gulf Standard Time (GST)' },
            { value: 'Asia/Singapore', display_name: 'Singapore Time (SGT)' },
        ],
        parent: [],
        head: [],
        employee: [],
        location: [],
        financial_year: [
            { value: '2023-24', display_name: '2023-24' },
            { value: '2024-25', display_name: '2024-25' },
            { value: '2025-26', display_name: '2025-26' },
        ],
        tax_regime: [
            { value: 'old', display_name: 'Old Regime' },
            { value: 'new', display_name: 'New Regime' },
        ],
        status: [
            { value: 'draft', display_name: 'Draft' },
            { value: 'processing', display_name: 'Processing' },
            { value: 'processed', display_name: 'Processed' },
            { value: 'approved', display_name: 'Approved' },
            { value: 'paid', display_name: 'Paid' },
        ],
        workflow_status: [
            { value: 'in_progress', display_name: 'In Progress' },
            { value: 'approved', display_name: 'Approved' },
            { value: 'rejected', display_name: 'Rejected' },
            { value: 'cancelled', display_name: 'Cancelled' },
            { value: 'escalated', display_name: 'Escalated' },
        ],
        accrual_type: [
            { value: 'yearly', display_name: 'Yearly' },
            { value: 'monthly', display_name: 'Monthly' },
            { value: 'quarterly', display_name: 'Quarterly' },
            { value: 'none', display_name: 'No Accrual' },
        ],
        entity_type: [
            { value: 'leave', display_name: 'Leave Request' },
            { value: 'attendance', display_name: 'Attendance Regularization' },
            { value: 'expense', display_name: 'Expense Claim' },
            { value: 'timesheet', display_name: 'Timesheet' },
            { value: 'resignation', display_name: 'Resignation' },
            { value: 'loan', display_name: 'Loan Request' },
        ],
        approver_type: [
            { value: 'reporting_manager', display_name: 'Reporting Manager' },
            { value: 'hr_manager', display_name: 'HR Manager' },
            { value: 'department_head', display_name: 'Department Head' },
            { value: 'role', display_name: 'Specific Role' },
            { value: 'user', display_name: 'Specific User' },
        ],
        workflow: [],
        approver_role: [],
        approver_user: [],
        current_approver: [],
    })

    // Fetch Departments and Employees for dropdowns
    useEffect(() => {
        const fetchDropdownOptions = async () => {
            try {
                const [deptRes, empRes, locRes, wfRes, roleRes] = await Promise.all([
                    api.get('/employees/departments/'),
                    api.get('/employees/'),
                    api.get('/employees/locations/'),
                    api.get('/workflows/definitions/'),
                    api.get('/abac/policies/').catch(() => ({ data: [] }))
                ])

                const extractData = (res: { data: unknown }) => {
                    const data = res.data as { data?: unknown[]; results?: unknown[] }
                    if (data?.data && Array.isArray(data.data)) return data.data
                    if (data?.results && Array.isArray(data.results)) return data.results
                    if (Array.isArray(data)) return data
                    return []
                }

                const deptsArr = extractData(deptRes)
                const empsArr = extractData(empRes)
                const locsArr = extractData(locRes)
                const wfsArr = extractData(wfRes)
                const rolesArr = extractData(roleRes)

                const depts = deptsArr.map((d) => ({
                    value: (d as Record<string, string>).id,
                    display_name: (d as Record<string, string>).name
                }))

                const emps = empsArr.map((e) => {
                    const emp = e as Record<string, string>
                    return {
                        value: emp.id,
                        display_name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username || emp.id
                    }
                })

                const locs = locsArr.map((l) => ({
                    value: (l as Record<string, string>).id,
                    display_name: (l as Record<string, string>).name
                }))

                const wfs = wfsArr.map((w) => ({
                    value: (w as Record<string, string>).id,
                    display_name: (w as Record<string, string>).name
                }))

                const roles = rolesArr.map((r) => ({
                    value: (r as Record<string, string>).id,
                    display_name: (r as Record<string, string>).name || (r as Record<string, string>).code
                }))

                setExtraChoices(prev => ({
                    ...prev,
                    parent: depts,
                    head: emps,
                    employee: emps,
                    location: locs,
                    current_approver: emps,
                    workflow: wfs,
                    approver_role: roles,
                    approver_user: emps,
                }))
            } catch (error) {
                console.error('Failed to fetch dropdown options:', error)
            }
        }
        fetchDropdownOptions()
    }, [])

    // Determine the API endpoint
    const endpoint = useMemo(() => {
        const base = `/${category}/${module}/`
        switch (category) {
            case 'employees':
                return module === 'employees' ? '/employees/' : `/employees/${module}/`
            case 'attendance':
                if (module === 'geofences') return '/attendance/geo-fences/'
                return `/attendance/${module}/`
            case 'ai':
                if (module === 'versions') return '/ai/models/'
                if (module === 'predictions') return '/ai/predictions/'
                return base
            default:
                return base
        }
    }, [category, module])

    // Load module metadata (fields)
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const response = await api.options(endpoint)
                let fields: AdminField[] = []

                if (response.data.actions?.POST) {
                    fields = Object.entries(response.data.actions.POST).map(([name, info]) => {
                        const fieldInfo = info as Record<string, unknown>
                        return {
                            name,
                            label: (fieldInfo.label as string) || name,
                            type: fieldInfo.type as string,
                            required: fieldInfo.required as boolean,
                            choices: fieldInfo.choices as { value: string; display_name: string }[],
                            read_only: fieldInfo.read_only as boolean
                        }
                    }).filter(f => !['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'is_deleted', 'tenant', 'employee_count'].includes(f.name) && !f.read_only)
                } else if (endpoint.includes('departments')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                        { name: 'description', label: 'Description', type: 'textarea', required: false },
                        { name: 'parent', label: 'Parent Department', type: 'choice', required: false },
                        { name: 'head', label: 'Department Head', type: 'choice', required: false },
                    ]
                } else if (endpoint.includes('attendance/shifts')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                        { name: 'start_time', label: 'Start Time', type: 'time', required: true },
                        { name: 'end_time', label: 'End Time', type: 'time', required: true },
                        { name: 'grace_in_minutes', label: 'Grace In (mins)', type: 'integer', required: false },
                        { name: 'grace_out_minutes', label: 'Grace Out (mins)', type: 'integer', required: false },
                        { name: 'break_duration_minutes', label: 'Break (mins)', type: 'integer', required: false },
                        { name: 'working_hours', label: 'Working Hours', type: 'decimal', required: false },
                        { name: 'is_night_shift', label: 'Night Shift', type: 'boolean', required: false },
                    ]
                } else if (endpoint.includes('attendance/geo-fences')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'location', label: 'Location', type: 'choice', required: true },
                        { name: 'latitude', label: 'Latitude', type: 'decimal', required: true },
                        { name: 'longitude', label: 'Longitude', type: 'decimal', required: true },
                        { name: 'radius_meters', label: 'Radius (meters)', type: 'integer', required: true },
                        { name: 'is_primary', label: 'Is Primary', type: 'boolean', required: false },
                    ]
                } else if (endpoint.includes('attendance/punches')) {
                    fields = [
                        { name: 'employee', label: 'Employee', type: 'choice', required: true },
                        { name: 'punch_type', label: 'Type', type: 'choice', required: true, choices: [{ value: 'in', display_name: 'Punch In' }, { value: 'out', display_name: 'Punch Out' }] },
                        { name: 'punch_time', label: 'Time', type: 'datetime', required: true },
                    ]
                } else if (endpoint.includes('attendance/fraud-logs')) {
                    fields = [
                        { name: 'employee', label: 'Employee', type: 'choice', required: true },
                        { name: 'fraud_type', label: 'Fraud Type', type: 'string', required: true },
                        { name: 'severity', label: 'Severity', type: 'choice', required: true, choices: [{ value: 'low', display_name: 'Low' }, { value: 'medium', display_name: 'Medium' }, { value: 'high', display_name: 'High' }, { value: 'critical', display_name: 'Critical' }] },
                    ]
                } else if (endpoint.includes('designations')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                        { name: 'level', label: 'Level', type: 'integer', required: true },
                        { name: 'grade', label: 'Grade', type: 'string', required: false },
                    ]
                } else if (endpoint.includes('locations')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                        { name: 'address_line1', label: 'Address Line 1', type: 'string', required: true },
                        { name: 'address_line2', label: 'Address Line 2', type: 'string', required: false },
                        { name: 'city', label: 'City', type: 'string', required: true },
                        { name: 'state', label: 'State', type: 'string', required: true },
                        { name: 'country', label: 'Country', type: 'choice', required: true },
                        { name: 'postal_code', label: 'Postal Code', type: 'string', required: true },
                        { name: 'timezone', label: 'Timezone', type: 'choice', required: false },
                    ]
                } else if (endpoint.includes('certifications')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'issuing_organization', label: 'Issuing Org', type: 'string', required: true },
                        { name: 'validity_months', label: 'Validity (months)', type: 'integer', required: false },
                    ]
                } else if (endpoint.includes('leave/types')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                        { name: 'annual_quota', label: 'Quota', type: 'decimal', required: true },
                        { name: 'accrual_type', label: 'Accrual', type: 'choice', required: true },
                    ]
                } else if (endpoint.includes('payroll/runs')) {
                    fields = [
                        { name: 'name', label: 'Run Name', type: 'string', required: true },
                        { name: 'month', label: 'Month', type: 'integer', required: true },
                        { name: 'year', label: 'Year', type: 'integer', required: true },
                        { name: 'pay_date', label: 'Pay Date', type: 'date', required: true },
                        { name: 'status', label: 'Status', type: 'choice', required: false },
                    ]
                } else if (endpoint.includes('payroll/tax-declarations')) {
                    fields = [
                        { name: 'employee', label: 'Employee', type: 'choice', required: true },
                        { name: 'financial_year', label: 'Financial Year', type: 'choice', required: true },
                        { name: 'tax_regime', label: 'Tax Regime', type: 'choice', required: true },
                    ]
                } else if (endpoint.includes('workflows/definitions')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                        { name: 'entity_type', label: 'Entity Type', type: 'choice', required: true },
                        { name: 'description', label: 'Description', type: 'textarea', required: false },
                        { name: 'sla_hours', label: 'SLA (Hours)', type: 'integer', required: false },
                        { name: 'auto_approve_on_sla', label: 'Auto Approve on SLA', type: 'boolean', required: false },
                    ]
                } else if (endpoint.includes('workflows/steps')) {
                    fields = [
                        { name: 'workflow', label: 'Workflow', type: 'choice', required: true },
                        { name: 'name', label: 'Step Name', type: 'string', required: true },
                        { name: 'order', label: 'Order', type: 'integer', required: true },
                        { name: 'approver_type', label: 'Approver Type', type: 'choice', required: true },
                        { name: 'approver_role', label: 'Role (if Role Based)', type: 'choice', required: false },
                        { name: 'approver_user', label: 'User (if User Based)', type: 'choice', required: false },
                        { name: 'sla_hours', label: 'Step SLA (Hours)', type: 'integer', required: false },
                        { name: 'is_optional', label: 'Is Optional', type: 'boolean', required: false },
                        { name: 'can_delegate', label: 'Can Delegate', type: 'boolean', required: false },
                    ]
                } else if (endpoint.includes('workflows/instances')) {
                    fields = [
                        { name: 'workflow', label: 'Workflow', type: 'choice', required: true },
                        { name: 'entity_type', label: 'Entity Type', type: 'choice', required: true },
                        // { name: 'entity_id', label: 'Entity ID (UUID)', type: 'string', required: true }, // Auto-generated
                        { name: 'current_step', label: 'Current Step', type: 'integer' },
                        { name: 'status', label: 'Status', type: 'choice', required: true, choices: extraChoices.workflow_status },
                        { name: 'current_approver', label: 'Current Approver', type: 'choice' },
                    ]
                } else if (endpoint.includes('rbac/permissions')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                        { name: 'description', label: 'Description', type: 'textarea', required: false },
                        {
                            name: 'module', label: 'Module', type: 'choice', required: true, choices: [
                                { value: 'employees', display_name: 'Employees' },
                                { value: 'attendance', display_name: 'Attendance' },
                                { value: 'leave', display_name: 'Leave' },
                                { value: 'payroll', display_name: 'Payroll' },
                                { value: 'performance', display_name: 'Performance' },
                                { value: 'recruitment', display_name: 'Recruitment' },
                                { value: 'rbac', display_name: 'RBAC' },
                                { value: 'workflows', display_name: 'Workflows' },
                                { value: 'reports', display_name: 'Reports' },
                                { value: 'billing', display_name: 'Billing' },
                                { value: 'settings', display_name: 'Settings' },
                            ]
                        },
                        {
                            name: 'permission_type', label: 'Type', type: 'choice', required: true, choices: [
                                { value: 'module', display_name: 'Module Access' },
                                { value: 'api', display_name: 'API Endpoint' },
                                { value: 'field', display_name: 'Field Access' },
                                { value: 'feature', display_name: 'Feature Flag' },
                            ]
                        },
                        {
                            name: 'action', label: 'Action', type: 'choice', required: true, choices: [
                                { value: 'view', display_name: 'View' },
                                { value: 'create', display_name: 'Create' },
                                { value: 'update', display_name: 'Update' },
                                { value: 'delete', display_name: 'Delete' },
                                { value: 'approve', display_name: 'Approve' },
                                { value: 'export', display_name: 'Export' },
                                { value: 'import', display_name: 'Import' },
                            ]
                        },
                        { name: 'category', label: 'Category', type: 'string', required: false },
                    ]
                } else if (endpoint.includes('rbac/roles')) {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                        { name: 'description', label: 'Description', type: 'textarea', required: false },
                        { name: 'is_system_role', label: 'System Role', type: 'boolean', required: false },
                        { name: 'level', label: 'Level', type: 'integer', required: false },
                    ]
                } else {
                    fields = [
                        { name: 'name', label: 'Name', type: 'string', required: true },
                        { name: 'code', label: 'Code', type: 'string', required: true },
                    ]
                }

                // Inject extra choices
                const finalFields = fields.map(f => {
                    const newField = { ...f }
                    // Only use extraChoices if choices not already defined
                    if (extraChoices[f.name] && (!newField.choices || newField.choices.length === 0)) {
                        newField.choices = extraChoices[f.name]
                        newField.type = 'choice'
                    }
                    if (['parent', 'head', 'country', 'timezone', 'employee', 'location',
                        'workflow', 'approver_role', 'approver_user', 'current_approver',
                        'approver_type', 'entity_type'].includes(f.name)) {
                        newField.type = 'choice'
                        if (!newField.choices || newField.choices.length === 0) {
                            newField.choices = extraChoices[f.name] || []
                        }
                    }
                    return newField
                })

                setMetadata(finalFields)
            } catch (error) {
                console.error('Failed to load metadata:', error)
            }
        }
        loadMetadata()
    }, [endpoint, extraChoices])

    const fetchData = useCallback(async (state: TableState): Promise<PaginatedData<Record<string, unknown>>> => {
        const response = await api.get<any>(endpoint, {
            params: {
                page: state.page,
                page_size: state.pageSize,
                search: state.search,
                ordering: state.sortOrder === 'desc' ? `-${state.sortBy}` : state.sortBy,
                ...state.filters,
            }
        })

        const data = response.data
        if (data.results) return data
        if (data.success && data.data && Array.isArray(data.data)) {
            return {
                results: data.data,
                count: data.pagination?.count || data.data.length,
                next: data.pagination?.next || null,
                previous: data.pagination?.previous || null,
            }
        }
        if (Array.isArray(data)) return { results: data, count: data.length, next: null, previous: null }
        return { results: [], count: 0, next: null, previous: null }
    }, [endpoint])

    const handleSave = async (data: Record<string, unknown>) => {
        // Sanitize data: Trim strings, convert empty to null
        const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
            if (typeof value === 'string') {
                const trimmed = value.trim()
                acc[key] = trimmed === '' ? null : trimmed
            } else {
                acc[key] = value
            }
            return acc
        }, {} as Record<string, unknown>)

        // Auto-generate UUID for workflow instances if missing
        if (endpoint.includes('workflows/instances') && !sanitizedData.entity_id) {
            try {
                sanitizedData.entity_id = crypto.randomUUID()
            } catch (e) {
                // Fallback UUID v4 generator
                sanitizedData.entity_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        }

        console.log('Sending Payload:', sanitizedData)

        try {
            if (selectedItem) {
                await api.patch(`${endpoint}${selectedItem.id}/`, sanitizedData)
            } else {
                await api.post(endpoint, sanitizedData)
            }
            setRefreshKey(prev => prev + 1)
        } catch (error: any) {
            console.error('Save failed details:', JSON.stringify(error.response?.data, null, 2))
            throw error // Re-throw to trigger the catch in generic modal if needed, or handle here
        }
    }

    const handleDelete = async () => {
        if (selectedItem) {
            await api.delete(`${endpoint}${selectedItem.id}/`)
            setIsDeleteDialogOpen(false)
            setRefreshKey(prev => prev + 1)
        }
    }

    const columns: Column<Record<string, unknown>>[] = useMemo(() => [
        {
            key: 'display_name',
            header: 'Name/Details',
            render: (_, row) => {
                const name = (row.name || row.title || row.label || row.display_name || row.username || row.id) as string
                let subtext = (row.code || row.email || row.employee_id || row.financial_year) as string

                if (endpoint.includes('attendance/shifts')) {
                    subtext = `${row.start_time} - ${row.end_time}`
                } else if (endpoint.includes('attendance/geo-fences')) {
                    subtext = `${row.location_name || ''} (${row.radius_meters}m)`
                } else if (endpoint.includes('payroll/runs')) {
                    subtext = `${row.month}/${row.year}`
                } else if (endpoint.includes('attendance/punches')) {
                    const time = row.punch_time ? new Date(row.punch_time as string).toLocaleTimeString() : ''
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-surface-900 dark:text-white">{(row.employee_id || row.employee) as string}</span>
                            <span className="text-xs text-surface-500">{row.punch_type === 'in' ? 'In' : 'Out'} at {time}</span>
                        </div>
                    )
                }

                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-surface-900 dark:text-white">{name}</span>
                        {subtext && <span className="text-[10px] font-bold text-surface-500 uppercase">{subtext}</span>}
                    </div>
                )
            }
        },
        {
            key: 'created_at',
            header: 'Created',
            render: (val) => val ? new Date(val as string).toLocaleDateString() : '-'
        },
        {
            key: 'actions',
            header: 'Actions',
            width: '100px',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedItem(row); setIsFormOpen(true); }} className="p-1.5 text-surface-500 hover:text-primary-600 rounded-lg">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedItem(row); setIsDeleteDialogOpen(true); }} className="p-1.5 text-surface-500 hover:text-red-600 rounded-lg">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], [endpoint])

    const title = module ? module.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Admin'
    const supportsImportExport = [
        'departments', 'designations',
        'locations', 'skills',
        'leave-types', 'leave-policies', 'holidays',
        'shifts', 'geo-fences',
        'asset-categories', 'assets',
        'expense-categories'
    ].includes(module || '');

    // Helper to download files
    const downloadFile = async (url: string, filename: string) => {
        try {
            const response = await api.get(url, { responseType: 'blob' })
            const href = URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = href
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(href)
        } catch (e) {
            console.error('Download failed', e)
            alert('Failed to download file.')
        }
    }

    const handleExport = () => downloadFile(`${endpoint}export/?export_format=csv`, `${module}_export.csv`)
    const handleDownloadTemplate = () => downloadFile(`${endpoint}template/?export_format=csv`, `${module}_import_template.csv`)

    const handleImport = async (file: File) => {
        const response = await apiUpload(`${endpoint}import/`, file) as any
        if (response.success_count && response.success_count > 0) {
            setRefreshKey(prev => prev + 1)
        }
        return response
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{title}</h1>
                <div className="flex items-center gap-2">
                    {supportsImportExport && (
                        <>
                            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                                <ArrowUpTrayIcon className="w-5 h-5" />
                                Export
                            </button>
                            <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary flex items-center gap-2">
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                Import
                            </button>
                        </>
                    )}
                    <button onClick={() => { setSelectedItem(null); setIsFormOpen(true); }} className="btn-primary">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create New
                    </button>
                </div>
            </div>

            <EnterpriseTable key={refreshKey} columns={columns} fetchData={fetchData} rowKey="id" searchPlaceholder={`Search ${title}...`} />

            <GenericFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSave} title={selectedItem ? `Edit ${title}` : `Create ${title}`} initialData={selectedItem} fields={metadata} />

            <BulkUploadModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onUpload={handleImport}
                onDownloadTemplate={handleDownloadTemplate}
                title={`Import ${title}`}
            />

            <ConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} onConfirm={handleDelete} title={`Delete ${title}`} message={`Are you sure? This cannot be undone.`} variant="danger" confirmText="Delete" />
        </div>
    )
}
