import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
    complianceService,
    DataRetentionPolicy,
    ConsentRecord,
    LegalHold,
} from '@/services/complianceService'
import {
    ShieldCheckIcon,
    DocumentTextIcon,
    ScaleIcon,
    ArrowPathIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline'

interface TabConfig {
    id: 'retention' | 'legal-holds' | 'consents'
    label: string
    icon: React.ComponentType<any>
    path: string
}

const tabs: TabConfig[] = [
    { id: 'retention', label: 'Retention Policies', icon: DocumentTextIcon, path: '/admin/compliance/retention' },
    { id: 'legal-holds', label: 'Legal Holds', icon: ScaleIcon, path: '/admin/compliance/legal-holds' },
    { id: 'consents', label: 'Consent Records', icon: ShieldCheckIcon, path: '/admin/compliance/consent' },
]

export default function CompliancePage() {
    const location = useLocation()
    const navigate = useNavigate()

    const currentTab: TabConfig = useMemo(() => {
        const match = tabs.find((t) => location.pathname.includes(t.path))
        return match || tabs[0]
    }, [location.pathname])

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([])
    const [consents, setConsents] = useState<ConsentRecord[]>([])
    const [legalHolds, setLegalHolds] = useState<LegalHold[]>([])

    const loadData = async (tab: TabConfig['id']) => {
        setIsLoading(true)
        setError('')
        try {
            if (tab === 'retention') {
                setRetentionPolicies(await complianceService.retention.list())
            } else if (tab === 'consents') {
                setConsents(await complianceService.consents.list())
            } else {
                setLegalHolds(await complianceService.legalHolds.list())
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to load data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData(currentTab.id)
    }, [currentTab.id])

    const handleTab = (tab: TabConfig) => {
        if (location.pathname !== tab.path) navigate(tab.path)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Compliance</h1>
                    </div>
                    <p className="text-surface-500 mt-2">Manage retention, legal holds, and consent records</p>
                </div>
                <button
                    onClick={() => loadData(currentTab.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 rounded-lg hover:bg-surface-200"
                >
                    <ArrowPathIcon className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm">
                <div className="flex border-b border-surface-200 dark:border-surface-700">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = tab.id === currentTab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTab(tab)}
                                className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'border-primary-600 text-primary-700'
                                        : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                <div className="p-6">
                    {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
                    {isLoading ? (
                        <div className="flex items-center justify-center min-h-[320px]">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div>
                            {currentTab.id === 'retention' && (
                                <RetentionSection
                                    items={retentionPolicies}
                                    onCreated={(item) => setRetentionPolicies((prev) => [item, ...prev])}
                                    onUpdated={(item) =>
                                        setRetentionPolicies((prev) => prev.map((p) => (p.id === item.id ? item : p)))
                                    }
                                    onDeleted={(id) => setRetentionPolicies((prev) => prev.filter((p) => p.id !== id))}
                                />
                            )}
                            {currentTab.id === 'legal-holds' && (
                                <LegalHoldSection
                                    items={legalHolds}
                                    onCreated={(item) => setLegalHolds((prev) => [item, ...prev])}
                                    onUpdated={(item) =>
                                        setLegalHolds((prev) => prev.map((p) => (p.id === item.id ? item : p)))
                                    }
                                    onDeleted={(id) => setLegalHolds((prev) => prev.filter((p) => p.id !== id))}
                                />
                            )}
                            {currentTab.id === 'consents' && (
                                <ConsentSection
                                    items={consents}
                                    onCreated={(item) => setConsents((prev) => [item, ...prev])}
                                    onUpdated={(item) =>
                                        setConsents((prev) => prev.map((p) => (p.id === item.id ? item : p)))
                                    }
                                    onDeleted={(id) => setConsents((prev) => prev.filter((p) => p.id !== id))}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function RetentionSection({
    items,
    onCreated,
    onUpdated,
    onDeleted,
}: {
    items: DataRetentionPolicy[]
    onCreated: (i: DataRetentionPolicy) => void
    onUpdated: (i: DataRetentionPolicy) => void
    onDeleted: (id: string) => void
}) {
    const emptyForm: DataRetentionPolicy = {
        name: '',
        entity_type: '',
        retention_days: 30,
        action: 'archive',
    }
    const [form, setForm] = useState<DataRetentionPolicy>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingId) {
                const updated = await complianceService.retention.update(editingId, form)
                onUpdated(updated)
            } else {
                const created = await complianceService.retention.create(form)
                onCreated(created)
            }
            setForm(emptyForm)
            setEditingId(null)
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (item: DataRetentionPolicy) => {
        setForm({ ...item })
        setEditingId(item.id || null)
    }

    const handleDelete = async (id?: string) => {
        if (!id) return
        if (!window.confirm('Delete this retention policy?')) return
        await complianceService.retention.delete(id)
        onDeleted(id)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Data Retention Policies</h2>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Name"
                    className="col-span-1 md:col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.entity_type}
                    onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
                    placeholder="Entity type (e.g. employees)"
                    className="col-span-1 md:col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    type="number"
                    min={1}
                    value={form.retention_days}
                    onChange={(e) => setForm({ ...form, retention_days: Number(e.target.value) })}
                    placeholder="Days"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <select
                    value={form.action}
                    onChange={(e) => setForm({ ...form, action: e.target.value as DataRetentionPolicy['action'] })}
                    className="col-span-1 px-3 py-2 border rounded"
                >
                    <option value="archive">Archive</option>
                    <option value="delete">Delete</option>
                    <option value="anonymize">Anonymize</option>
                </select>
                <div className="col-span-1 flex gap-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                        <PlusIcon className="w-4 h-4" /> {editingId ? 'Update' : 'Add'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null)
                                setForm(emptyForm)
                            }}
                            className="px-3 py-2 border rounded"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                    <div key={item.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-surface-500">{item.entity_type}</p>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.name}</h3>
                                <p className="text-sm text-surface-500">{item.retention_days} days • {item.action}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700">
                                    <PencilIcon className="w-4 h-4 text-surface-500" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50">
                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-surface-500">No policies yet.</p>}
            </div>
        </div>
    )
}

function ConsentSection({
    items,
    onCreated,
    onUpdated,
    onDeleted,
}: {
    items: ConsentRecord[]
    onCreated: (i: ConsentRecord) => void
    onUpdated: (i: ConsentRecord) => void
    onDeleted: (id: string) => void
}) {
    const emptyForm: ConsentRecord = {
        employee: '',
        consent_type: '',
        granted: false,
        granted_at: '',
        revoked_at: '',
        ip_address: '',
    }
    const [form, setForm] = useState<ConsentRecord>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload: ConsentRecord = {
                ...form,
                granted_at: form.granted_at || null,
                revoked_at: form.revoked_at || null,
                ip_address: form.ip_address || null,
            }
            if (editingId) {
                const updated = await complianceService.consents.update(editingId, payload)
                onUpdated(updated)
            } else {
                const created = await complianceService.consents.create(payload)
                onCreated(created)
            }
            setForm(emptyForm)
            setEditingId(null)
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (item: ConsentRecord) => {
        setForm({
            ...item,
            granted_at: item.granted_at || '',
            revoked_at: item.revoked_at || '',
            ip_address: item.ip_address || '',
        })
        setEditingId(item.id || null)
    }

    const handleDelete = async (id?: string) => {
        if (!id) return
        if (!window.confirm('Delete this consent record?')) return
        await complianceService.consents.delete(id)
        onDeleted(id)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Consent Records</h2>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <input
                    required
                    value={form.employee}
                    onChange={(e) => setForm({ ...form, employee: e.target.value })}
                    placeholder="Employee ID"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.consent_type}
                    onChange={(e) => setForm({ ...form, consent_type: e.target.value })}
                    placeholder="Consent type"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <select
                    value={form.granted ? 'yes' : 'no'}
                    onChange={(e) => setForm({ ...form, granted: e.target.value === 'yes' })}
                    className="col-span-1 px-3 py-2 border rounded"
                >
                    <option value="yes">Granted</option>
                    <option value="no">Revoked</option>
                </select>
                <input
                    type="datetime-local"
                    value={form.granted_at || ''}
                    onChange={(e) => setForm({ ...form, granted_at: e.target.value })}
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    type="datetime-local"
                    value={form.revoked_at || ''}
                    onChange={(e) => setForm({ ...form, revoked_at: e.target.value })}
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <div className="col-span-1 flex gap-2">
                    <input
                        value={form.ip_address || ''}
                        onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                        placeholder="IP address"
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <div className="col-span-1 flex gap-2 md:col-span-6 justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                        <PlusIcon className="w-4 h-4" /> {editingId ? 'Update' : 'Add'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null)
                                setForm(emptyForm)
                            }}
                            className="px-3 py-2 border rounded"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-surface-500">Employee: {item.employee}</p>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.consent_type}</h3>
                                <p className="text-sm text-surface-500">
                                    Status: {item.granted ? 'Granted' : 'Revoked'}
                                    {item.granted_at && ` • Granted at ${item.granted_at}`}
                                    {item.revoked_at && ` • Revoked at ${item.revoked_at}`}
                                    {item.ip_address && ` • IP ${item.ip_address}`}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700">
                                    <PencilIcon className="w-4 h-4 text-surface-500" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50">
                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-surface-500">No consent records yet.</p>}
            </div>
        </div>
    )
}

function LegalHoldSection({
    items,
    onCreated,
    onUpdated,
    onDeleted,
}: {
    items: LegalHold[]
    onCreated: (i: LegalHold) => void
    onUpdated: (i: LegalHold) => void
    onDeleted: (id: string) => void
}) {
    const emptyForm: LegalHold = {
        name: '',
        description: '',
        employees: [],
        start_date: '',
        end_date: '',
    }
    const [form, setForm] = useState<LegalHold>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload: LegalHold = {
                ...form,
                employees: (form.employees || []).filter((e) => e).map((e) => e.trim()),
                end_date: form.end_date || null,
            }
            if (editingId) {
                const updated = await complianceService.legalHolds.update(editingId, payload)
                onUpdated(updated)
            } else {
                const created = await complianceService.legalHolds.create(payload)
                onCreated(created)
            }
            setForm(emptyForm)
            setEditingId(null)
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (item: LegalHold) => {
        setForm({
            ...item,
            employees: item.employees || [],
            end_date: (item as any).end_date || '',
        })
        setEditingId(item.id || null)
    }

    const handleDelete = async (id?: string) => {
        if (!id) return
        if (!window.confirm('Delete this legal hold?')) return
        await complianceService.legalHolds.delete(id)
        onDeleted(id)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Legal Holds</h2>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Name"
                    className="col-span-2 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description"
                    className="col-span-2 px-3 py-2 border rounded"
                />
                <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    type="date"
                    value={form.end_date || ''}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <div className="col-span-3">
                    <input
                        value={(form.employees || []).join(', ')}
                        onChange={(e) => setForm({ ...form, employees: e.target.value.split(',').map((v) => v.trim()) })}
                        placeholder="Employee IDs (comma separated)"
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <div className="col-span-3 flex gap-2 justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                        <PlusIcon className="w-4 h-4" /> {editingId ? 'Update' : 'Add'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingId(null)
                                setForm(emptyForm)
                            }}
                            className="px-3 py-2 border rounded"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.name}</h3>
                                <p className="text-sm text-surface-500">{item.description}</p>
                                <p className="text-sm text-surface-500">
                                    {item.start_date} → {(item as any).end_date || 'open'}
                                </p>
                                <p className="text-sm text-surface-500">
                                    Employees: {(item.employees || []).join(', ') || 'None'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700">
                                    <PencilIcon className="w-4 h-4 text-surface-500" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50">
                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-surface-500">No legal holds yet.</p>}
            </div>
        </div>
    )
}
