import type React from 'react'
import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { coreService, AuditLog } from '@/services/coreService'
import {
    ClipboardDocumentListIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline'

export default function AuditLogsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [filters, setFilters] = useState({
        action: '',
        resource_type: '',
    })

    const loadLogs = async () => {
        setIsLoading(true)
        setError('')
        try {
            const params: Record<string, any> = {}
            if (filters.action) params.action = filters.action
            if (filters.resource_type) params.resource_type = filters.resource_type
            const data = await coreService.auditLogs.list(params)
            setLogs(data)
        } catch (err: any) {
            setError(err?.message || 'Failed to load audit logs')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadLogs()
    }, [filters])

    const actions = [...new Set(logs.map((l) => l.action))]
    const resourceTypes = [...new Set(logs.map((l) => l.resource_type))]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <ClipboardDocumentListIcon className="w-8 h-8 text-primary-600" />
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Audit Logs</h1>
                    </div>
                    <p className="text-surface-500 mt-2">Track all system changes and user actions</p>
                </div>
                <button
                    onClick={loadLogs}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 rounded-lg hover:bg-surface-200"
                >
                    <ArrowPathIcon className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Action
                    </label>
                    <select
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    >
                        <option value="">All Actions</option>
                        {actions.map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Resource Type
                    </label>
                    <select
                        value={filters.resource_type}
                        onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    >
                        <option value="">All Resources</option>
                        {resourceTypes.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="p-4 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200">{error}</div>}

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <LoadingSpinner size="lg" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                    <ClipboardDocumentListIcon className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                    <p className="text-surface-600 dark:text-surface-400">No audit logs found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                className="w-full text-left px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {expandedId === log.id ? (
                                        <ChevronDownIcon className="w-5 h-5 text-surface-400" />
                                    ) : (
                                        <ChevronRightIcon className="w-5 h-5 text-surface-400" />
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-surface-900 dark:text-white">{log.action}</span>
                                            <span className="text-sm text-surface-500">{log.resource_type}</span>
                                            <span className="text-sm text-surface-400">#{log.resource_id}</span>
                                        </div>
                                        <p className="text-sm text-surface-500 mt-1">
                                            By {log.user_email || 'Unknown'} • {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        log.action === 'CREATE'
                                            ? 'bg-green-100 text-green-700'
                                            : log.action === 'DELETE'
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-blue-100 text-blue-700'
                                    }`}
                                >
                                    {log.action}
                                </span>
                            </button>

                            {expandedId === log.id && (
                                <div className="border-t border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-900/30 space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {log.user_agent && (
                                            <div>
                                                <p className="text-surface-500 font-medium">User Agent</p>
                                                <p className="text-surface-700 dark:text-surface-300 break-all">{log.user_agent}</p>
                                            </div>
                                        )}
                                        {log.ip_address && (
                                            <div>
                                                <p className="text-surface-500 font-medium">IP Address</p>
                                                <p className="text-surface-700 dark:text-surface-300">{log.ip_address}</p>
                                            </div>
                                        )}
                                        {log.request_id && (
                                            <div>
                                                <p className="text-surface-500 font-medium">Request ID</p>
                                                <p className="text-surface-700 dark:text-surface-300 break-all">{log.request_id}</p>
                                            </div>
                                        )}
                                        {log.tenant_id && (
                                            <div>
                                                <p className="text-surface-500 font-medium">Tenant</p>
                                                <p className="text-surface-700 dark:text-surface-300">{log.tenant_id}</p>
                                            </div>
                                        )}
                                    </div>

                                    {log.changed_fields && log.changed_fields.length > 0 && (
                                        <div>
                                            <p className="text-surface-500 font-medium text-sm">Changed Fields</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {log.changed_fields.map((field) => (
                                                    <span
                                                        key={field}
                                                        className="px-2 py-1 text-xs bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded"
                                                    >
                                                        {field}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {log.old_values && (
                                        <div>
                                            <p className="text-surface-500 font-medium text-sm">Previous Values</p>
                                            <pre className="mt-1 p-2 bg-white dark:bg-surface-800 rounded border border-surface-300 dark:border-surface-600 text-xs overflow-x-auto">
                                                {JSON.stringify(log.old_values, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {log.new_values && (
                                        <div>
                                            <p className="text-surface-500 font-medium text-sm">New Values</p>
                                            <pre className="mt-1 p-2 bg-white dark:bg-surface-800 rounded border border-surface-300 dark:border-surface-600 text-xs overflow-x-auto">
                                                {JSON.stringify(log.new_values, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
