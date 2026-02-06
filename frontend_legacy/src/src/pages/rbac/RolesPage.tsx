/**
 * RBAC Management - Simple Roles with Inline Permissions
 * No tabs - just roles list with permission selection when creating/editing
 */

import { useEffect, useState } from 'react'
import { useRbacStore } from '@/store/rbacStore'
import { useAbacStore } from '@/store/abacStore'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { api } from '@/services/api'
import {
    ShieldCheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    UserGroupIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolidIcon } from '@heroicons/react/24/solid'

export default function RolesPage() {
    const {
        roles,
        isLoadingRoles,
        rolesError,
        fetchRoles,
        permissionsByModule,
        fetchPermissions,
        isLoadingPermissions,
        createRole,
        deleteRole
    } = useRbacStore()
    // RBAC opt-in only; default to ABAC unless VITE_RBAC_ENABLED=true
    const rbacEnabled = import.meta.env.VITE_RBAC_ENABLED === 'true'

    const {
        policies,
        attributeTypes,
        isLoadingPolicies,
        isLoadingAttributeTypes,
        fetchPolicies,
        fetchAttributeTypes
    } = useAbacStore()
    const hasPermission = useAuthStore((state) => state.hasPermission)
    const canEdit = hasPermission('rbac.update')
    const canDelete = hasPermission('rbac.delete')

    const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingRole, setEditingRole] = useState<any>(null)

    useEffect(() => {
        if (rbacEnabled) {
            fetchRoles()
            fetchPermissions()
        } else {
            fetchPolicies()
            fetchAttributeTypes()
        }
    }, [rbacEnabled, fetchRoles, fetchPermissions, fetchPolicies, fetchAttributeTypes])

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Delete role "${name}"? Users with this role will lose access.`)) {
            await deleteRole(id)
        }
    }

    const isLoading = rbacEnabled
        ? isLoadingRoles || isLoadingPermissions
        : isLoadingPolicies || isLoadingAttributeTypes
    const rolesList = Array.isArray(roles) ? roles : []
    const modules = Object.keys(permissionsByModule).sort()
    const policyList = Array.isArray(policies) ? policies : []

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        {rbacEnabled ? 'Roles & Access' : 'Policies & Access (ABAC)'}
                    </h1>
                    <p className="text-surface-500 mt-1">
                        {rbacEnabled
                            ? `${rolesList.length} roles • ${Object.values(permissionsByModule).flat().length} permissions`
                            : `${policyList.length} policies • ${attributeTypes.length} attributes`}
                    </p>
                </div>
                {rbacEnabled && (
                    <div className="flex items-center gap-2">
                        {canEdit && Object.values(permissionsByModule).flat().length === 0 && (
                            <SeedPermissionsButton onSuccess={fetchPermissions} />
                        )}
                        {canEdit && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Create Role
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Error */}
            {rolesError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">{rolesError}</div>
            )}

            {/* Content */}
            {rbacEnabled ? (
                rolesList.length === 0 ? (
                    <EmptyState onAction={canEdit ? () => setShowCreateModal(true) : undefined} />
                ) : (
                    <div className="space-y-3">
                        {rolesList.map((role) => (
                            <div key={role.id} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                                {/* Role Header */}
                                <div className="flex items-center justify-between px-5 py-4">
                                    <button
                                        onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
                                        className="flex items-center gap-4 flex-1"
                                    >
                                        {expandedRoleId === role.id
                                            ? <ChevronDownIcon className="w-5 h-5 text-surface-400" />
                                            : <ChevronRightIcon className="w-5 h-5 text-surface-400" />
                                        }
                                        <div className={`p-2 rounded-lg ${role.is_system_role ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-surface-100 dark:bg-surface-700'}`}>
                                            <ShieldCheckIcon className={`w-5 h-5 ${role.is_system_role ? 'text-primary-600' : 'text-surface-500'}`} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-surface-900 dark:text-white">
                                                {role.name}
                                                {role.is_system_role && <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">System</span>}
                                            </h3>
                                            <p className="text-sm text-surface-500">{role.description || role.code}</p>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-surface-500">
                                            <UserGroupIcon className="w-4 h-4" />
                                            <span className="text-sm">{role.user_count || 0}</span>
                                        </div>
                                        <span className="px-2 py-0.5 text-xs bg-surface-100 dark:bg-surface-700 text-surface-600 rounded-full">
                                            {role.permission_count || 0} perms
                                        </span>
                                        {canEdit && !role.is_system_role && (
                                            <div className="flex items-center gap-1 ml-2">
                                                <button
                                                    onClick={() => setEditingRole(role)}
                                                    className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(role.id, role.name)}
                                                        className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Permissions View */}
                                {expandedRoleId === role.id && (
                                    <div className="border-t border-surface-200 dark:border-surface-700 p-5 bg-surface-50 dark:bg-surface-900/30">
                                        <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Assigned Permissions</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                            {modules.map((module) => {
                                                const perms = permissionsByModule[module] || []
                                                if (perms.length === 0) return null
                                                return (
                                                    <div key={module} className="text-xs">
                                                        <span className="font-medium text-surface-900 dark:text-white capitalize">{module}:</span>
                                                        <span className="text-surface-500 ml-1">{perms.map((p: any) => p.action).join(', ')}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <AbacPolicySection policies={policyList} attributeCount={attributeTypes.length} onRefresh={() => { fetchPolicies(); fetchAttributeTypes() }} />
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingRole) && (
                <RoleFormModal
                    role={editingRole}
                    modules={modules}
                    permissionsByModule={permissionsByModule}
                    onClose={() => { setShowCreateModal(false); setEditingRole(null) }}
                    onSuccess={() => { setShowCreateModal(false); setEditingRole(null); fetchRoles() }}
                    createRole={createRole}
                />
            )}
        </div>
    )
}

function EmptyState({ onAction }: { onAction?: () => void }) {
    return (
        <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-surface-400" />
            <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">No roles yet</h3>
            <p className="mt-1 text-sm text-surface-500">Create roles to manage access.</p>
            {onAction && (
                <button onClick={onAction} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <PlusIcon className="w-4 h-4" /> Create Role
                </button>
            )}
        </div>
    )
}

/* ========== ROLE FORM MODAL WITH PERMISSIONS ========== */
interface RoleFormModalProps {
    role?: any
    modules: string[]
    permissionsByModule: Record<string, any[]>
    onClose: () => void
    onSuccess: () => void
    createRole: (data: any) => Promise<any>
}

function RoleFormModal({ role, modules, permissionsByModule, onClose, onSuccess, createRole }: RoleFormModalProps) {
    const isEditing = !!role
    const [name, setName] = useState(role?.name || '')
    const [code, setCode] = useState(role?.code || '')
    const [description, setDescription] = useState(role?.description || '')
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [permissionSearch, setPermissionSearch] = useState('')

    const togglePermission = (permId: string) => {
        const next = new Set(selectedPermissions)
        if (next.has(permId)) next.delete(permId)
        else next.add(permId)
        setSelectedPermissions(next)
    }

    const toggleModule = (module: string) => {
        const perms = permissionsByModule[module] || []
        const allSelected = perms.every((p: any) => selectedPermissions.has(p.id))
        const next = new Set(selectedPermissions)
        perms.forEach((p: any) => {
            if (allSelected) next.delete(p.id)
            else next.add(p.id)
        })
        setSelectedPermissions(next)
    }

    const filteredModules = modules.filter(m =>
        m.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        permissionsByModule[m]?.some(p => p.action.toLowerCase().includes(permissionSearch.toLowerCase()))
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await createRole({
                name,
                code,
                description,
                is_active: true,
                permission_ids: Array.from(selectedPermissions)
            })
            onSuccess()
        } catch (error) {
            console.error('Failed to save role:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                            {isEditing ? 'Edit Role' : 'Create New Role'}
                        </h3>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Department Manager"
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Code *</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                    placeholder="e.g., dept_manager"
                                    className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm font-mono"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What can this role do?"
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                            />
                        </div>

                        {/* Permissions Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                                    Permissions ({selectedPermissions.size} selected)
                                </label>
                                <div className="relative w-48">
                                    <input
                                        type="text"
                                        value={permissionSearch}
                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                        placeholder="Search permissions..."
                                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 focus:ring-primary-500"
                                    />
                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredModules.map((module) => {
                                    const perms = permissionsByModule[module] || []
                                    const selectedCount = perms.filter((p: any) => selectedPermissions.has(p.id)).length
                                    const allSelected = perms.length > 0 && selectedCount === perms.length

                                    return (
                                        <div key={module} className="p-3 bg-surface-50 dark:bg-surface-900/50 rounded-lg border border-surface-200 dark:border-surface-700">
                                            <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={() => toggleModule(module)}
                                                    className="rounded border-surface-300 text-primary-600"
                                                />
                                                <span className="font-medium text-surface-900 dark:text-white capitalize text-sm">
                                                    {module.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-surface-500">({selectedCount}/{perms.length})</span>
                                            </label>
                                            <div className="space-y-1 pl-5">
                                                {perms.map((perm: any) => (
                                                    <label key={perm.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPermissions.has(perm.id)}
                                                            onChange={() => togglePermission(perm.id)}
                                                            className="rounded border-surface-300 text-primary-600"
                                                        />
                                                        <span className="text-surface-600 dark:text-surface-400 capitalize">{perm.action}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Role' : 'Create Role')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* ========== SEED PERMISSIONS BUTTON ========== */
function SeedPermissionsButton({ onSuccess }: { onSuccess: () => void }) {
    const rbacEnabled = import.meta.env.VITE_RBAC_ENABLED === 'true'
    const [isSeeding, setIsSeeding] = useState(false)
    const [message, setMessage] = useState('')

    // Hide the seeder when RBAC APIs are disabled (ABAC-only environments)
    if (!rbacEnabled) return null

    const handleSeed = async () => {
        setIsSeeding(true)
        setMessage('')
        try {
            const response = await api.post('/rbac/permissions/seed/')
            const data = response.data
            setMessage(`Created ${data.message || data.total || 0} permissions!`)
            onSuccess()
        } catch (error: any) {
            console.error('Seed failed:', error)
            setMessage('Failed to seed permissions')
        } finally {
            setIsSeeding(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
                {isSeeding ? 'Seeding...' : '⚡ Seed Permissions'}
            </button>
            {message && <span className="text-sm text-green-600">{message}</span>}
        </div>
    )
}

/* ========== ABAC FALLBACK VIEW ========== */
function AbacPolicySection({ policies, attributeCount, onRefresh }: { policies: any[]; attributeCount: number; onRefresh: () => void }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldSolidIcon className="w-6 h-6 text-primary-600" />
                    <div>
                        <p className="text-surface-600 dark:text-surface-400 text-sm">ABAC Overview</p>
                        <p className="text-surface-900 dark:text-white text-lg font-semibold">{policies.length} policies • {attributeCount} attributes</p>
                    </div>
                </div>
                <button
                    onClick={onRefresh}
                    className="px-3 py-2 text-sm bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200 rounded-lg hover:bg-primary-100"
                >
                    Refresh
                </button>
            </div>

            {policies.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl">
                    <ShieldCheckIcon className="w-10 h-10 text-surface-400 mx-auto" />
                    <p className="mt-3 text-surface-600 dark:text-surface-400">No policies yet. Create policies in the ABAC module.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {policies.map((policy) => (
                        <div key={policy.id} className="p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-surface-500">{policy.code}</p>
                                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{policy.name}</h3>
                                    <p className="text-sm text-surface-500 line-clamp-2">{policy.description}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${policy.effect === 'ALLOW' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {policy.effect}
                                </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm text-surface-600 dark:text-surface-400">
                                <span>{policy.rules?.length || 0} rules</span>
                                <span className={policy.is_active ? 'text-green-600' : 'text-surface-500'}>{policy.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
