import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
    aiService,
    AIModelVersion,
    AIPrediction,
} from '@/services/aiService'
import {
    CpuChipIcon,
    SparklesIcon,
    ArrowPathIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline'

interface TabConfig {
    id: 'models' | 'predictions'
    label: string
    icon: React.ComponentType<any>
    path: string
}

const tabs: TabConfig[] = [
    { id: 'models', label: 'Model Versions', icon: CpuChipIcon, path: '/admin/ai/versions' },
    { id: 'predictions', label: 'Predictions', icon: SparklesIcon, path: '/admin/ai/predictions' },
]

export default function AIServicePage() {
    const location = useLocation()
    const navigate = useNavigate()

    const currentTab: TabConfig = useMemo(() => {
        const match = tabs.find((t) => location.pathname.includes(t.path))
        return match || tabs[0]
    }, [location.pathname])

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [models, setModels] = useState<AIModelVersion[]>([])
    const [predictions, setPredictions] = useState<AIPrediction[]>([])

    const loadData = async (tab: TabConfig['id']) => {
        setIsLoading(true)
        setError('')
        try {
            if (tab === 'models') {
                setModels(await aiService.models.list())
            } else {
                setPredictions(await aiService.predictions.list())
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
                        <CpuChipIcon className="w-8 h-8 text-primary-600" />
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">AI Services</h1>
                    </div>
                    <p className="text-surface-500 mt-2">Manage AI models and prediction logs</p>
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
                            {currentTab.id === 'models' && (
                                <ModelsSection
                                    items={models}
                                    onCreated={(item) => setModels((prev) => [item, ...prev])}
                                    onUpdated={(item) =>
                                        setModels((prev) => prev.map((p) => (p.id === item.id ? item : p)))
                                    }
                                    onDeleted={(id) => setModels((prev) => prev.filter((p) => p.id !== id))}
                                />
                            )}
                            {currentTab.id === 'predictions' && (
                                <PredictionsSection
                                    items={predictions}
                                    models={models}
                                    onCreated={(item) => setPredictions((prev) => [item, ...prev])}
                                    onUpdated={(item) =>
                                        setPredictions((prev) => prev.map((p) => (p.id === item.id ? item : p)))
                                    }
                                    onDeleted={(id) => setPredictions((prev) => prev.filter((p) => p.id !== id))}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ModelsSection({
    items,
    onCreated,
    onUpdated,
    onDeleted,
}: {
    items: AIModelVersion[]
    onCreated: (i: AIModelVersion) => void
    onUpdated: (i: AIModelVersion) => void
    onDeleted: (id: string) => void
}) {
    const emptyForm: AIModelVersion = {
        name: '',
        model_type: '',
        version: '',
        model_path: '',
        is_active: false,
        accuracy: null,
    }
    const [form, setForm] = useState<AIModelVersion>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingId) {
                const updated = await aiService.models.update(editingId, form)
                onUpdated(updated)
            } else {
                const created = await aiService.models.create(form)
                onCreated(created)
            }
            setForm(emptyForm)
            setEditingId(null)
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (item: AIModelVersion) => {
        setForm({ ...item })
        setEditingId(item.id || null)
    }

    const handleDelete = async (id?: string) => {
        if (!id) return
        if (!window.confirm('Delete this model version?')) return
        await aiService.models.delete(id)
        onDeleted(id)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">AI Model Versions</h2>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-7 gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Name"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.model_type}
                    onChange={(e) => setForm({ ...form, model_type: e.target.value })}
                    placeholder="Type (e.g. resume_parser)"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    placeholder="Version"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.model_path}
                    onChange={(e) => setForm({ ...form, model_path: e.target.value })}
                    placeholder="Model path"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={form.accuracy || ''}
                    onChange={(e) => setForm({ ...form, accuracy: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Accuracy %"
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
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                    <div key={item.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-surface-500">{item.model_type}</p>
                                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.name}</h3>
                                <p className="text-sm text-surface-500">v{item.version}</p>
                                <p className="text-sm text-surface-500">{item.model_path}</p>
                                {item.accuracy && <p className="text-sm text-surface-500">Accuracy: {item.accuracy}%</p>}
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
                {items.length === 0 && <p className="text-surface-500">No models yet.</p>}
            </div>
        </div>
    )
}

function PredictionsSection({
    items,
    models,
    onCreated,
    onUpdated,
    onDeleted,
}: {
    items: AIPrediction[]
    models: AIModelVersion[]
    onCreated: (i: AIPrediction) => void
    onUpdated: (i: AIPrediction) => void
    onDeleted: (id: string) => void
}) {
    const emptyForm: AIPrediction = {
        model_version: '',
        entity_type: '',
        entity_id: '',
        prediction: {},
        confidence: 0,
        human_reviewed: false,
        human_override: null,
    }
    const [form, setForm] = useState<AIPrediction>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload: AIPrediction = {
                ...form,
                human_override: form.human_override || null,
            }
            if (editingId) {
                const updated = await aiService.predictions.update(editingId, payload)
                onUpdated(updated)
            } else {
                const created = await aiService.predictions.create(payload)
                onCreated(created)
            }
            setForm(emptyForm)
            setEditingId(null)
        } finally {
            setSubmitting(false)
        }
    }

    const startEdit = (item: AIPrediction) => {
        setForm({
            ...item,
            human_override: (item as any).human_override || null,
        })
        setEditingId(item.id || null)
    }

    const handleDelete = async (id?: string) => {
        if (!id) return
        if (!window.confirm('Delete this prediction?')) return
        await aiService.predictions.delete(id)
        onDeleted(id)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Predictions</h2>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-7 gap-3 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                <select
                    required
                    value={typeof form.model_version === 'string' ? form.model_version : form.model_version?.id || ''}
                    onChange={(e) => setForm({ ...form, model_version: e.target.value })}
                    className="col-span-1 px-3 py-2 border rounded"
                >
                    <option value="">Select Model</option>
                    {models.map((m) => (
                        <option key={m.id} value={m.id || ''}>
                            {m.name} v{m.version}
                        </option>
                    ))}
                </select>
                <input
                    required
                    value={form.entity_type}
                    onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
                    placeholder="Entity type"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    required
                    value={form.entity_id}
                    onChange={(e) => setForm({ ...form, entity_id: e.target.value })}
                    placeholder="Entity ID"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                    value={form.confidence}
                    onChange={(e) => setForm({ ...form, confidence: Number(e.target.value) })}
                    placeholder="Confidence"
                    className="col-span-1 px-3 py-2 border rounded"
                />
                <label className="col-span-1 flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.human_reviewed}
                        onChange={(e) => setForm({ ...form, human_reviewed: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm">Reviewed</span>
                </label>
                <div className="col-span-2 flex gap-2">
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
                {items.map((item) => {
                    const modelName = typeof item.model_version === 'object' 
                        ? `${item.model_version.name} v${item.model_version.version}`
                        : item.model_version
                    return (
                        <div key={item.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-surface-500">Model: {modelName}</p>
                                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                                        {item.entity_type}:{item.entity_id}
                                    </h3>
                                    <p className="text-sm text-surface-500">
                                        Confidence: {item.confidence}% • {item.human_reviewed ? 'Reviewed' : 'Not reviewed'}
                                    </p>
                                    <p className="text-sm text-surface-500 mt-1">
                                        Prediction: {JSON.stringify(item.prediction).substring(0, 60)}...
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
                    )
                })}
                {items.length === 0 && <p className="text-surface-500">No predictions yet.</p>}
            </div>
        </div>
    )
}
