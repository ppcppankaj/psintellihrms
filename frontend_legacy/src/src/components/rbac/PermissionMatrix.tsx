/**
 * PermissionMatrix Component - Checkbox grid for assigning permissions to roles
 */

import { useState, useEffect } from 'react'
import { useRbacStore } from '@/store/rbacStore'
import { Permission } from '@/services/rbacService'
import Card from '@/components/ui/Card'

interface PermissionMatrixProps {
    roleId: string
    selectedPermissions: string[]
    onChange: (permissionIds: string[]) => void
    readOnly?: boolean
}

export default function PermissionMatrix({
    roleId: _roleId,
    selectedPermissions,
    onChange,
    readOnly = false
}: PermissionMatrixProps) {
    const { permissionsByModule, fetchPermissions, isLoadingPermissions } = useRbacStore()
    const [expandedModules, setExpandedModules] = useState<string[]>([])

    useEffect(() => {
        fetchPermissions()
    }, [fetchPermissions])

    // Expand all modules with selected permissions initially
    useEffect(() => {
        if (Object.keys(permissionsByModule).length > 0) {
            const modulesWithSelected = Object.entries(permissionsByModule)
                .filter(([_, perms]) => perms.some(p => selectedPermissions.includes(p.id)))
                .map(([module]) => module)
            setExpandedModules(modulesWithSelected)
        }
    }, [permissionsByModule, selectedPermissions])

    const toggleModule = (module: string) => {
        setExpandedModules(prev =>
            prev.includes(module)
                ? prev.filter(m => m !== module)
                : [...prev, module]
        )
    }

    const togglePermission = (permissionId: string) => {
        if (readOnly) return
        onChange(
            selectedPermissions.includes(permissionId)
                ? selectedPermissions.filter(id => id !== permissionId)
                : [...selectedPermissions, permissionId]
        )
    }

    const toggleModuleAll = (_moduleKey: string, permissions: Permission[]) => {
        if (readOnly) return
        const modulePermIds = permissions.map(p => p.id)
        const allSelected = modulePermIds.every(id => selectedPermissions.includes(id))

        if (allSelected) {
            onChange(selectedPermissions.filter(id => !modulePermIds.includes(id)))
        } else {
            onChange([...new Set([...selectedPermissions, ...modulePermIds])])
        }
    }

    if (isLoadingPermissions) {
        return <PermissionMatrixSkeleton />
    }

    const modules = Object.keys(permissionsByModule).sort()

    return (
        <div className="space-y-3">
            {modules.map(module => {
                const permissions = permissionsByModule[module]
                const isExpanded = expandedModules.includes(module)
                const selectedCount = permissions.filter(p => selectedPermissions.includes(p.id)).length
                const allSelected = selectedCount === permissions.length

                return (
                    <Card key={module} padding="none" className="overflow-hidden">
                        {/* Module Header */}
                        <button
                            onClick={() => toggleModule(module)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <ChevronIcon expanded={isExpanded} />
                                <span className="font-medium text-surface-900 dark:text-white">
                                    {formatModuleName(module)}
                                </span>
                                <span className="text-xs text-surface-500 bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                                    {selectedCount}/{permissions.length}
                                </span>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleModuleAll(module, permissions)
                                    }}
                                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                >
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </button>

                        {/* Permissions List */}
                        {isExpanded && (
                            <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {permissions.map(permission => (
                                    <label
                                        key={permission.id}
                                        className={`
                      flex items-start gap-3 p-3 rounded-lg border
                      ${selectedPermissions.includes(permission.id)
                                                ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'
                                                : 'border-surface-200 dark:border-surface-700'
                                            }
                      ${readOnly ? 'cursor-default' : 'cursor-pointer hover:border-primary-400'}
                      transition-colors
                    `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedPermissions.includes(permission.id)}
                                            onChange={() => togglePermission(permission.id)}
                                            disabled={readOnly}
                                            className="mt-0.5 w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-surface-900 dark:text-white">
                                                {permission.name}
                                            </p>
                                            <p className="text-xs text-surface-500 mt-0.5">
                                                {permission.code}
                                            </p>
                                            {permission.description && (
                                                <p className="text-xs text-surface-400 mt-1">
                                                    {permission.description}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}

function PermissionMatrixSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-surface-100 dark:bg-surface-800 rounded-xl" />
            ))}
        </div>
    )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
    return (
        <svg
            className={`w-4 h-4 text-surface-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )
}

function formatModuleName(module: string): string {
    return module
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
