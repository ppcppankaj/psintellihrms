/**
 * RoleForm Component - Create/Edit role form
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRbacStore } from '@/store/rbacStore'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import PermissionMatrix from './PermissionMatrix'

interface RoleFormProps {
    roleId?: string
    mode: 'create' | 'edit'
}

export default function RoleForm({ roleId, mode }: RoleFormProps) {
    const navigate = useNavigate()
    const {
        currentRole,
        fetchRole,
        createRole,
        updateRole,
        updateRolePermissions,
        isLoadingRoles
    } = useRbacStore()

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        is_active: true,
    })
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Load role data for edit mode
    useEffect(() => {
        if (mode === 'edit' && roleId) {
            fetchRole(roleId)
        }
    }, [mode, roleId, fetchRole])

    // Populate form when role is loaded
    useEffect(() => {
        if (mode === 'edit' && currentRole) {
            setFormData({
                name: currentRole.name,
                code: currentRole.code,
                description: currentRole.description || '',
                is_active: currentRole.is_active,
            })
            setSelectedPermissions(currentRole.permissions.map(p => p.id))
        }
    }, [mode, currentRole])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.name.trim()) newErrors.name = 'Role name is required'
        if (!formData.code.trim()) newErrors.code = 'Role code is required'
        if (!/^[A-Z_]+$/.test(formData.code)) {
            newErrors.code = 'Code must be uppercase letters and underscores only'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setIsSubmitting(true)
        try {
            if (mode === 'create') {
                const role = await createRole({ ...formData, permission_ids: selectedPermissions })
                navigate(`/rbac/roles/${role.id}`)
            } else if (roleId) {
                await updateRole(roleId, formData)
                await updateRolePermissions(roleId, selectedPermissions)
                navigate(`/rbac/roles/${roleId}`)
            }
        } catch (error: unknown) {
            const axiosError = error as import('axios').AxiosError<{ message?: string }>
            setErrors({ submit: axiosError.response?.data?.message || 'Failed to save role' })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoadingRoles && mode === 'edit') {
        return <FormSkeleton />
    }

    const isSystemRole = currentRole?.is_system_role

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader
                    title="Role Information"
                    subtitle={isSystemRole ? 'System roles cannot be renamed' : undefined}
                />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isSystemRole}
                                placeholder="e.g., HR Manager"
                                className={`
                  w-full px-3 py-2 rounded-lg border
                  ${errors.name ? 'border-red-500' : 'border-surface-300 dark:border-surface-600'}
                  bg-white dark:bg-surface-800 text-surface-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Role Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={mode === 'edit'}
                                placeholder="e.g., HR_MANAGER"
                                className={`
                  w-full px-3 py-2 rounded-lg border font-mono
                  ${errors.code ? 'border-red-500' : 'border-surface-300 dark:border-surface-600'}
                  bg-white dark:bg-surface-800 text-surface-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                            />
                            {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Describe what this role can do..."
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500"
                            />
                            <label className="text-sm text-surface-700 dark:text-surface-300">
                                Active role
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
                <CardHeader
                    title="Permissions"
                    subtitle={`${selectedPermissions.length} permissions selected`}
                />
                <CardContent>
                    <PermissionMatrix
                        roleId={roleId || ''}
                        selectedPermissions={selectedPermissions}
                        onChange={setSelectedPermissions}
                    />
                </CardContent>
            </Card>

            {/* Submit */}
            {errors.submit && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                    {errors.submit}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/rbac/roles')}
                    className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}

function FormSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-48 bg-surface-100 dark:bg-surface-800 rounded-xl" />
            <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-xl" />
        </div>
    )
}
