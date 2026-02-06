/**
 * RoleDetailPage - View role details with permissions
 */

import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRbacStore } from '@/store/rbacStore'
import { useAuthStore } from '@/store/authStore'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PermissionMatrix from '@/components/rbac/PermissionMatrix'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function RoleDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const { currentRole, isLoadingRoles, rolesError, fetchRole, deleteRole, clearCurrentRole } = useRbacStore()
    const hasPermission = useAuthStore((state) => state.hasPermission)
    const canEdit = hasPermission('rbac.edit')
    const canDelete = hasPermission('rbac.delete')

    useEffect(() => {
        if (id) {
            fetchRole(id)
        }
        return () => clearCurrentRole()
    }, [id, fetchRole, clearCurrentRole])

    const handleDelete = async () => {
        if (!id || !currentRole) return
        if (currentRole.is_system_role) {
            alert('System roles cannot be deleted.')
            return
        }
        if (window.confirm('Are you sure you want to delete this role?')) {
            await deleteRole(id)
            navigate('/rbac/roles')
        }
    }

    if (isLoadingRoles) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (rolesError || !currentRole) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Role not found</h2>
                <p className="text-surface-500 mt-2">{rolesError || 'The requested role could not be found.'}</p>
                <Link to="/rbac/roles" className="inline-block mt-4 text-primary-600 hover:text-primary-700">
                    ← Back to Roles
                </Link>
            </div>
        )
    }

    const selectedPermissionIds = currentRole.permissions.map(p => p.id)

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-surface-500">
                <Link to="/rbac/roles" className="hover:text-primary-600">Roles</Link>
                <span>/</span>
                <span className="text-surface-900 dark:text-white">{currentRole.name}</span>
            </nav>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                            {currentRole.name}
                        </h1>
                        {currentRole.is_system_role && (
                            <Badge variant="info">System Role</Badge>
                        )}
                        {!currentRole.is_active && (
                            <Badge variant="warning">Inactive</Badge>
                        )}
                    </div>
                    <p className="text-surface-500 mt-1">
                        {currentRole.description || 'No description'}
                    </p>
                    <p className="text-sm text-surface-400 mt-2 font-mono">
                        Code: {currentRole.code}
                    </p>
                </div>
                <div className="flex gap-3">
                    {canEdit && (
                        <Link
                            to={`/rbac/roles/${id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                        >
                            <EditIcon />
                            Edit
                        </Link>
                    )}
                    {canDelete && !currentRole.is_system_role && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600/50 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <DeleteIcon />
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent>
                        <p className="text-sm text-surface-500">Permissions</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                            {currentRole.permissions.length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <p className="text-sm text-surface-500">Users Assigned</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                            {currentRole.user_count || 0}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent>
                        <p className="text-sm text-surface-500">Status</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">
                            {currentRole.is_active ? 'Active' : 'Inactive'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Permissions */}
            <Card>
                <CardHeader title="Permissions" subtitle="View all permissions assigned to this role" />
                <CardContent>
                    <PermissionMatrix
                        roleId={id || ''}
                        selectedPermissions={selectedPermissionIds}
                        onChange={() => { }}
                        readOnly
                    />
                </CardContent>
            </Card>
        </div>
    )
}

function EditIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    )
}

function DeleteIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
}
