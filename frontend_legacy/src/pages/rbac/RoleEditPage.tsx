/**
 * RoleEditPage - Edit existing role
 */

import { Link, useParams } from 'react-router-dom'
import RoleForm from '@/components/rbac/RoleForm'

export default function RoleEditPage() {
    const { id } = useParams<{ id: string }>()

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-surface-500">
                <Link to="/rbac/roles" className="hover:text-primary-600">Roles</Link>
                <span>/</span>
                <Link to={`/rbac/roles/${id}`} className="hover:text-primary-600">Role</Link>
                <span>/</span>
                <span className="text-surface-900 dark:text-white">Edit</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Edit Role
                </h1>
                <p className="text-surface-500 mt-1">
                    Modify role settings and permissions
                </p>
            </div>

            {/* Form */}
            <RoleForm roleId={id} mode="edit" />
        </div>
    )
}
