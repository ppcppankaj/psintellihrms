/**
 * RoleCreatePage - Create new role
 */

import { Link } from 'react-router-dom'
import RoleForm from '@/components/rbac/RoleForm'

export default function RoleCreatePage() {
    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-surface-500">
                <Link to="/rbac/roles" className="hover:text-primary-600">Roles</Link>
                <span>/</span>
                <span className="text-surface-900 dark:text-white">New Role</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Create New Role
                </h1>
                <p className="text-surface-500 mt-1">
                    Define a new role with specific permissions
                </p>
            </div>

            {/* Form */}
            <RoleForm mode="create" />
        </div>
    )
}
