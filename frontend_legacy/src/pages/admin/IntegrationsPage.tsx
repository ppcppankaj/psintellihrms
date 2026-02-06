import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
    integrationsService,
    Integration,
    Webhook,
    APIKey,
} from '@/services/integrationsService'
import {
    LinkIcon,
    GlobeAltIcon,
    KeyIcon,
    ArrowPathIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline'

interface TabConfig {
    id: 'integrations' | 'webhooks' | 'api-keys'
    label: string
    icon: React.ComponentType<any>
    path: string
}

const tabs: TabConfig[] = [
    { id: 'integrations', label: 'Integrations', icon: LinkIcon, path: '/admin/integrations/hub' },
    { id: 'webhooks', label: 'Webhooks', icon: GlobeAltIcon, path: '/admin/integrations/webhooks' },
    { id: 'api-keys', label: 'API Keys', icon: KeyIcon, path: '/admin/integrations/api-keys' },
]

export default function IntegrationsPage() {
    const location = useLocation()
    const navigate = useNavigate()

    const currentTab: TabConfig = useMemo(() => {
        const match = tabs.find((t) => location.pathname.includes(t.path))
        return match || tabs[0]
    }, [location.pathname])

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [integrations, setIntegrations] = useState<Integration[]>([])
    const [webhooks, setWebhooks] = useState<Webhook[]>([])
    const [apiKeys, setApiKeys] = useState<APIKey[]>([])

    const loadData = async (tab: TabConfig['id']) => {
        setIsLoading(true)
        setError('')
        try {
            if (tab === 'integrations') {
                setIntegrations(await integrationsService.integrations.list())
            } else if (tab === 'webhooks') {
                setWebhooks(await integrationsService.webhooks.list())
            } else {
                setApiKeys(await integrationsService.apiKeys.list())
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
                        <LinkIcon className="w-8 h-8 text-primary-600" />
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Integrations</h1>
                    </div>
                    <p className="text-surface-500 mt-2">Manage external integrations, webhooks, and API keys</p>
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
                            {currentTab.id === 'integrations' && (
                                <IntegrationsSection
                                    items={integrations}
                                    onCreated={(item) => setIntegrations((prev) => [item, ...prev])}
                                    onUpdated={(item) =>
                                        setIntegrations((prev) => prev.map((p) => (p.id === item.id ? item : p)))
                                    }
                                    onDeleted={(id) => setIntegrations((prev) => prev.filter((p) => p.id !== id))}
                                />
                            )}
                            {currentTab.id === 'webhooks' && (
                                <WebhooksSection
                                    items={webhooks}
                                    onCreated={(item) => setWebhooks((prev) => [item, ...prev])}
                                    onUpdated={(item) =>
                                        setWebhooks((prev) => prev.map((p) => (p.id === item.id ? item : p)))
                                    }
                                    onDeleted={(id) => setWebhooks((prev) => prev.filter((p) => p.id !== id))}
                                />
                            )}
                            {currentTab.id === 'api-keys' && (
                                <APIKeysSection
                                    items={apiKeys}
                                    onCreated={(item) => setApiKeys((prev) => [item, ...prev])}
                                    onUpdated={(item) =>
                                        setApiKeys((prev) => prev.map((p) => (p.id === item.id ? item : p)))
                                    }
                                    onDeleted={(id) => setApiKeys((prev) => prev.filter((p) => p.id !== id))}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function IntegrationsSection({
    items,
    onCreated,
    onUpdated,
    onDeleted,
}: {
    items: Integration[]
    onCreated: (i: Integration) => void
    onUpdated: (i: Integration) => void
    onDeleted: (id: string) => void
}) {
    const emptyForm: Integration = {
        name: '',
        provider: '',
        config: {},
        credentials: {},
        is_connected: false,
    }
    const [form, setForm] = useState<Integration>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingId) {
                const updated = await integrationsService.integrations.update(editingId, form)
                onUpdated(updated)
            } else {
                const created = await integrationsService.integrations.create(form)
                onCreated(created)
            }
            setForm(emptyForm)
            setEditingId(null)
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (item: Integration) => {
        setForm({ ...item })
        setEditingId(item.id || null)
    }

    const handleDelete = async (id?: string) => {
        if (!id) return
        if (!window.confirm('Delete this integration?')) return
        await integrationsService.integrations.delete(id)
        onDeleted(id)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">External Integrations</h2>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Name"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    placeholder="Provider (e.g. slack)"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <label className="col-span-1 flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.is_connected}
                        onChange={(e) => setForm({ ...form, is_connected: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm">Connected</span>
                </label>
                <textarea
                    value={JSON.stringify(form.config)}
                    onChange={(e) => {
                        try {
                            setForm({ ...form, config: JSON.parse(e.target.value) })
                        } catch {
                            // Keep form state on JSON parse error
                        }
                    }}
                    placeholder="Config (JSON)"
                    className="col-span-1 px-3 py-2 border rounded text-xs"
                    rows={3}
                />
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
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.name}</h3>
                                <p className="text-sm text-surface-500">{item.provider}</p>
                                {item.last_sync && <p className="text-sm text-surface-500">Last sync: {new Date(item.last_sync).toLocaleString()}</p>}
                                <span className={`mt-2 inline-block px-2 py-1 rounded text-xs ${item.is_connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {item.is_connected ? 'Connected' : 'Not Connected'}
                                </span>
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
                {items.length === 0 && <p className="text-surface-500">No integrations yet.</p>}
            </div>
        </div>
    )
}

function WebhooksSection({
    items,
    onCreated,
    onUpdated,
    onDeleted,
}: {
    items: Webhook[]
    onCreated: (i: Webhook) => void
    onUpdated: (i: Webhook) => void
    onDeleted: (id: string) => void
}) {
    const emptyForm: Webhook = {
        name: '',
        url: '',
        secret: '',
        events: [],
        headers: {},
        is_active: true,
    }
    const [form, setForm] = useState<Webhook>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingId) {
                const updated = await integrationsService.webhooks.update(editingId, form)
                onUpdated(updated)
            } else {
                const created = await integrationsService.webhooks.create(form)
                onCreated(created)
            }
            setForm(emptyForm)
            setEditingId(null)
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (item: Webhook) => {
        setForm({ ...item })
        setEditingId(item.id || null)
    }

    const handleDelete = async (id?: string) => {
        if (!id) return
        if (!window.confirm('Delete this webhook?')) return
        await integrationsService.webhooks.delete(id)
        onDeleted(id)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Webhooks</h2>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Name"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="URL"
                    className="col-span-2 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.secret}
                    onChange={(e) => setForm({ ...form, secret: e.target.value })}
                    placeholder="Secret"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <label className="col-span-1 flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm">Active</span>
                </label>
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
                <input
                    value={(form.events || []).join(', ')}
                    onChange={(e) => setForm({ ...form, events: e.target.value.split(',').map((v) => v.trim()) })}
                    placeholder="Events (comma separated)"
                    className="col-span-3 px-3 py-2 border rounded"
                />
            </form>

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.name}</h3>
                                <p className="text-sm text-surface-500 break-all">{item.url}</p>
                                {item.events && item.events.length > 0 && (
                                    <p className="text-sm text-surface-500 mt-1">Events: {item.events.join(', ')}</p>
                                )}
                                <span className={`mt-2 inline-block px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {item.is_active ? 'Active' : 'Inactive'}
                                </span>
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
                {items.length === 0 && <p className="text-surface-500">No webhooks yet.</p>}
            </div>
        </div>
    )
}

function APIKeysSection({
    items,
    onCreated,
    onUpdated,
    onDeleted,
}: {
    items: APIKey[]
    onCreated: (i: APIKey) => void
    onUpdated: (i: APIKey) => void
    onDeleted: (id: string) => void
}) {
    const emptyForm: APIKey = {
        name: '',
        permissions: [],
        rate_limit: 1000,
        expires_at: null,
    }
    const [form, setForm] = useState<APIKey>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingId) {
                const updated = await integrationsService.apiKeys.update(editingId, form)
                onUpdated(updated)
            } else {
                const created = await integrationsService.apiKeys.create(form)
                onCreated(created)
            }
            setForm(emptyForm)
            setEditingId(null)
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (item: APIKey) => {
        setForm({
            ...item,
            expires_at: (item as any).expires_at || null,
        })
        setEditingId(item.id || null)
    }

    const handleDelete = async (id?: string) => {
        if (!id) return
        if (!window.confirm('Delete this API key?')) return
        await integrationsService.apiKeys.delete(id)
        onDeleted(id)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">API Keys</h2>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Key name"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    type="number"
                    min={1}
                    value={form.rate_limit}
                    onChange={(e) => setForm({ ...form, rate_limit: Number(e.target.value) })}
                    placeholder="Rate limit"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    type="datetime-local"
                    value={form.expires_at || ''}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value || null })}
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    value={(form.permissions || []).join(', ')}
                    onChange={(e) => setForm({ ...form, permissions: e.target.value.split(',').map((v) => v.trim()) })}
                    placeholder="Permissions (comma separated)"
                    className="col-span-2 px-3 py-2 border rounded"
                />
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

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.name}</h3>
                                {item.key && <p className="text-sm text-surface-500 font-mono">{item.key.substring(0, 20)}...</p>}
                                <p className="text-sm text-surface-500">
                                    Rate limit: {item.rate_limit}/request
                                    {item.expires_at && ` • Expires: ${new Date(item.expires_at).toLocaleDateString()}`}
                                </p>
                                {item.permissions && item.permissions.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {item.permissions.map((p) => (
                                            <span key={p} className="px-2 py-1 text-xs bg-surface-100 dark:bg-surface-700 rounded">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {item.last_used && <p className="text-sm text-surface-500 mt-1">Last used: {new Date(item.last_used).toLocaleString()}</p>}
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
                {items.length === 0 && <p className="text-surface-500">No API keys yet.</p>}
            </div>
        </div>
    )
}
