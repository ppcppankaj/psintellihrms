/**
 * PermissionsPage - List all permissions grouped by module
 */

import { useEffect, useState } from 'react'
import { useRbacStore } from '@/store/rbacStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ChevronDownIcon, ChevronRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function PermissionsPage() {
    const { permissionsByModule, isLoadingPermissions, fetchPermissions } = useRbacStore()
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchPermissions()
    }, [fetchPermissions])

    const toggleModule = (module: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev)
            if (next.has(module)) {
                next.delete(module)
            } else {
                next.add(module)
            }
            return next
        })
    }

    const expandAll = () => {
        setExpandedModules(new Set(Object.keys(permissionsByModule)))
    }

    const collapseAll = () => {
        setExpandedModules(new Set())
    }

    if (isLoadingPermissions) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    const modules = Object.keys(permissionsByModule).sort()
    const totalPermissions = Object.values(permissionsByModule).flat().length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Permissions
                    </h1>
                    <p className="text-surface-500 mt-1">
                        {totalPermissions} permissions across {modules.length} modules
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={expandAll}
                        className="px-3 py-1.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-3 py-1.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Permissions by Module */}
            {modules.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-3">
                    {modules.map((module) => {
                        const permissions = permissionsByModule[module]
                        const isExpanded = expandedModules.has(module)

                        return (
                            <div
                                key={module}
                                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                            >
                                {/* Module Header */}
                                <button
                                    onClick={() => toggleModule(module)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                            <ChevronDownIcon className="w-5 h-5 text-surface-400" />
                                        ) : (
                                            <ChevronRightIcon className="w-5 h-5 text-surface-400" />
                                        )}
                                        <span className="font-semibold text-surface-900 dark:text-white capitalize">
                                            {module.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                                        {permissions.length} permissions
                                    </span>
                                </button>

                                {/* Permissions List */}
                                {isExpanded && (
                                    <div className="border-t border-surface-200 dark:border-surface-700">
                                        <table className="w-full">
                                            <thead className="bg-surface-50 dark:bg-surface-900/50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                                        Code
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                                        Description
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                                                {permissions.map((perm) => (
                                                    <tr
                                                        key={perm.id}
                                                        className="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
                                                    >
                                                        <td className="px-4 py-2">
                                                            <code className="px-2 py-0.5 text-xs font-mono bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded">
                                                                {perm.code}
                                                            </code>
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-surface-900 dark:text-white">
                                                            {perm.name}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-surface-500">
                                                            {perm.description || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function EmptyState() {
    return (
        <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-surface-400" />
            <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">
                No permissions found
            </h3>
            <p className="mt-1 text-sm text-surface-500">
                Permissions are automatically created when modules are installed.
            </p>
        </div>
    )
}
