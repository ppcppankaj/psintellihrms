/**
 * RBAC Service - API calls for roles and permissions management
 */

import { api } from './api'

// Types
export interface Permission {
    id: string
    code: string
    name: string
    description: string
    module: string
    category: string
}

export interface Role {
    id: string
    name: string
    code: string
    description: string
    is_system_role: boolean
    is_active: boolean
    permissions: Permission[]
    user_count: number
    created_at: string
    updated_at: string
}

export interface RoleListItem {
    id: string
    name: string
    code: string
    description: string
    is_system_role: boolean
    is_active: boolean
    permission_count: number
    user_count: number
}

export interface UserRole {
    id: string
    user: {
        id: string
        email: string
        full_name: string
    }
    role: {
        id: string
        name: string
        code: string
    }
    assigned_at: string
    assigned_by: string
}

export interface RoleFormData {
    name: string
    code: string
    description: string
    is_active: boolean
    permission_ids: string[]
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

class RbacService {
    // Opt-in only: enable RBAC calls when VITE_RBAC_ENABLED=true
    private enabled = import.meta.env.VITE_RBAC_ENABLED === 'true'
    private basePath = '/rbac'

    private ensureEnabled() {
        if (!this.enabled) {
            throw new Error('RBAC API is disabled')
        }
    }

    // Get all roles
    async getRoles(): Promise<RoleListItem[]> {
        if (!this.enabled) return []
        try {
            const response = await api.get<any>(`${this.basePath}/roles/`)
            const data = response.data
            // Handle various response formats
            if (data?.results && Array.isArray(data.results)) return data.results
            if (data?.data && Array.isArray(data.data)) return data.data
            if (Array.isArray(data)) return data
        } catch {
            // RBAC endpoints were removed after ABAC migration; return empty to keep UI stable
            return []
        }
        return []
    }

    // Get single role with permissions
    async getRole(id: string): Promise<Role> {
        this.ensureEnabled()
        const response = await api.get<Role>(`${this.basePath}/roles/${id}/`)
        return response.data
    }

    // Create role
    async createRole(data: RoleFormData): Promise<Role> {
        this.ensureEnabled()
        const response = await api.post<Role>(`${this.basePath}/roles/`, data)
        return response.data
    }

    // Update role
    async updateRole(id: string, data: Partial<RoleFormData>): Promise<Role> {
        this.ensureEnabled()
        const response = await api.patch<Role>(`${this.basePath}/roles/${id}/`, data)
        return response.data
    }

    // Delete role
    async deleteRole(id: string): Promise<void> {
        this.ensureEnabled()
        await api.delete(`${this.basePath}/roles/${id}/`)
    }

    // Get all permissions (grouped by module)
    async getPermissions(): Promise<Permission[]> {
        if (!this.enabled) return []
        try {
            const response = await api.get<any>(`${this.basePath}/permissions/`)
            const data = response.data
            // Handle various response formats
            if (data?.results && Array.isArray(data.results)) return data.results
            if (data?.data && Array.isArray(data.data)) return data.data
            if (Array.isArray(data)) return data
        } catch {
            // Return empty when RBAC endpoints are unavailable
            return []
        }
        return []
    }

    // Get permissions grouped by module
    async getPermissionsGrouped(): Promise<Record<string, Permission[]>> {
        if (!this.enabled) return {}
        const permissions = await this.getPermissions()
        return permissions.reduce((acc, perm) => {
            const module = perm.module || 'Other'
            if (!acc[module]) acc[module] = []
            acc[module].push(perm)
            return acc
        }, {} as Record<string, Permission[]>)
    }

    // Update role permissions
    async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
        this.ensureEnabled()
        const response = await api.put<Role>(`${this.basePath}/roles/${roleId}/permissions/`, {
            permission_ids: permissionIds
        })
        return response.data
    }

    // Get users with their roles
    async getUserRoles(): Promise<UserRole[]> {
        if (!this.enabled) return []
        try {
            const response = await api.get<any>(`${this.basePath}/user-roles/`)
            const data = response.data
            // Handle various response formats
            if (data?.results && Array.isArray(data.results)) return data.results
            if (data?.data && Array.isArray(data.data)) return data.data
            if (Array.isArray(data)) return data
        } catch {
            return []
        }
        return []
    }

    // Assign role to user
    async assignRole(userId: string, roleId: string): Promise<UserRole> {
        this.ensureEnabled()
        const response = await api.post<UserRole>(`${this.basePath}/user-roles/`, {
            user_id: userId,
            role_id: roleId
        })
        return response.data
    }

    // Remove role from user
    async removeUserRole(userRoleId: string): Promise<void> {
        this.ensureEnabled()
        await api.delete(`${this.basePath}/user-roles/${userRoleId}/`)
    }
}

export const rbacService = new RbacService()
