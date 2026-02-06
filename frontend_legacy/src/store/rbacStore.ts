/**
 * RBAC Store - Zustand state management for roles and permissions
 */

import { create } from 'zustand'
import {
    rbacService,
    Role,
    RoleListItem,
    Permission,
    UserRole
} from '@/services/rbacService'

interface RbacState {
    // Roles
    roles: RoleListItem[]
    currentRole: Role | null
    isLoadingRoles: boolean
    rolesError: string | null

    // Permissions
    permissions: Permission[]
    permissionsByModule: Record<string, Permission[]>
    isLoadingPermissions: boolean

    // User Roles
    userRoles: UserRole[]
    isLoadingUserRoles: boolean

    // Actions
    fetchRoles: () => Promise<void>
    fetchRole: (id: string) => Promise<void>
    createRole: (data: any) => Promise<Role>
    updateRole: (id: string, data: any) => Promise<Role>
    deleteRole: (id: string) => Promise<void>
    fetchPermissions: () => Promise<void>
    updateRolePermissions: (roleId: string, permissionIds: string[]) => Promise<void>
    fetchUserRoles: () => Promise<void>
    assignRole: (userId: string, roleId: string) => Promise<void>
    removeUserRole: (userRoleId: string) => Promise<void>
    clearCurrentRole: () => void
}

export const useRbacStore = create<RbacState>((set, get) => ({
    // Initial state
    roles: [],
    currentRole: null,
    isLoadingRoles: false,
    rolesError: null,

    permissions: [],
    permissionsByModule: {},
    isLoadingPermissions: false,

    userRoles: [],
    isLoadingUserRoles: false,

    // Actions
    fetchRoles: async () => {
        set({ isLoadingRoles: true, rolesError: null })
        try {
            const roles = await rbacService.getRoles()
            set({ roles, isLoadingRoles: false })
        } catch (error: any) {
            set({
                rolesError: error.response?.data?.message || 'Failed to fetch roles',
                isLoadingRoles: false
            })
        }
    },

    fetchRole: async (id: string) => {
        set({ isLoadingRoles: true })
        try {
            const role = await rbacService.getRole(id)
            set({ currentRole: role, isLoadingRoles: false })
        } catch (error: any) {
            set({
                rolesError: error.response?.data?.message || 'Failed to fetch role',
                isLoadingRoles: false
            })
        }
    },

    createRole: async (data) => {
        const role = await rbacService.createRole(data)
        await get().fetchRoles()
        return role
    },

    updateRole: async (id: string, data) => {
        const role = await rbacService.updateRole(id, data)
        set({ currentRole: role })
        await get().fetchRoles()
        return role
    },

    deleteRole: async (id: string) => {
        await rbacService.deleteRole(id)
        await get().fetchRoles()
    },

    fetchPermissions: async () => {
        set({ isLoadingPermissions: true })
        try {
            const [permissions, grouped] = await Promise.all([
                rbacService.getPermissions(),
                rbacService.getPermissionsGrouped()
            ])
            set({
                permissions,
                permissionsByModule: grouped,
                isLoadingPermissions: false
            })
        } catch {
            set({ isLoadingPermissions: false })
        }
    },

    updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
        const role = await rbacService.updateRolePermissions(roleId, permissionIds)
        set({ currentRole: role })
        await get().fetchRoles()
    },

    fetchUserRoles: async () => {
        set({ isLoadingUserRoles: true })
        try {
            const userRoles = await rbacService.getUserRoles()
            set({ userRoles, isLoadingUserRoles: false })
        } catch {
            set({ isLoadingUserRoles: false })
        }
    },

    assignRole: async (userId: string, roleId: string) => {
        await rbacService.assignRole(userId, roleId)
        await get().fetchUserRoles()
    },

    removeUserRole: async (userRoleId: string) => {
        await rbacService.removeUserRole(userRoleId)
        await get().fetchUserRoles()
    },

    clearCurrentRole: () => {
        set({ currentRole: null, rolesError: null })
    },
}))
