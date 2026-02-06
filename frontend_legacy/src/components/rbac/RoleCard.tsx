/**
 * RoleCard Component - Card display for a role
 */

import { Link } from 'react-router-dom'
import { RoleListItem } from '@/services/rbacService'
import Badge from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'

interface RoleCardProps {
    role: RoleListItem
    onDelete?: (id: string) => void
}

export default function RoleCard({ role, onDelete }: RoleCardProps) {
    const hasPermission = useAuthStore((state) => state.hasPermission)
    const canEdit = hasPermission('rbac.edit')
    const canDelete = hasPermission('rbac.delete') && !role.is_system_role

    return (
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5 hover:shadow-md hover:border-surface-300 dark:hover:border-surface-600 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/rbac/roles/${role.id}`}
                            className="text-lg font-semibold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                        >
                            {role.name}
                        </Link>
                        {role.is_system_role && (
                            <Badge variant="info" size="sm">System</Badge>
                        )}
                        {!role.is_active && (
                            <Badge variant="warning" size="sm">Inactive</Badge>
                        )}
                    </div>
                    <p className="text-sm text-surface-500 mt-1">{role.description || 'No description'}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1.5 text-surface-500">
                            <KeyIcon />
                            <span>{role.permission_count} permissions</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-surface-500">
                            <UsersIcon />
                            <span>{role.user_count} users</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Link
                        to={`/rbac/roles/${role.id}`}
                        className="p-2 text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                        title="View"
                    >
                        <EyeIcon />
                    </Link>
                    {canEdit && (
                        <Link
                            to={`/rbac/roles/${role.id}/edit`}
                            className="p-2 text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <EditIcon />
                        </Link>
                    )}
                    {canDelete && onDelete && (
                        <button
                            onClick={() => onDelete(role.id)}
                            className="p-2 text-surface-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <DeleteIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Icons
function KeyIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    )
}

function UsersIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    )
}

function EyeIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
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
