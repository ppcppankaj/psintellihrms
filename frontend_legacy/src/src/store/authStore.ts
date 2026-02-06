/**
 * Auth Store - Zustand state management for authentication
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthTokens, Tenant, MenuItem } from '@/types'
import { clearApiBranch } from '@/services/api'

interface AuthState {
    // State
    user: User | null
    tokens: AuthTokens | null
    organization: Organization | null
    isAuthenticated: boolean
    isLoading: boolean
    menuItems: MenuItem[]

    // Actions
    setUser: (user: User | null) => void
    setTokens: (tokens: AuthTokens | null) => void
    setOrganization: (organization: Organization | null) => void
    setMenuItems: (items: MenuItem[]) => void
    login: (user: User, tokens: AuthTokens) => void
    logout: () => void
    updateUser: (data: Partial<User>) => void
    hasPermission: (permission: string) => boolean
    hasRole: (role: string) => boolean
    hasAnyPermission: (...permissions: string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            tokens: null,
            organization: null,
            isAuthenticated: false,
            isLoading: true,
            menuItems: [],

            // Actions
            setUser: (user) => set({ user, isAuthenticated: !!user }),

            setTokens: (tokens) => set({ tokens }),

            setOrganization: (organization) => set({ organization }),

            setMenuItems: (items) => set({ menuItems: items }),

            login: (user, tokens) => set({
                user,
                tokens,
                isAuthenticated: true,
                isLoading: false,
            }),

            logout: () => {
                // Clear branch context on logout
                clearApiBranch()
                // Clear auth state
                set({
                    user: null,
                    tokens: null,
                    organization: null,
                    isAuthenticated: false,
                    menuItems: [],
                })
            },

            updateUser: (data) => set((state) => ({
                user: state.user ? { ...state.user, ...data } : null,
            })),

            hasPermission: (permission) => {
                const { user } = get()
                if (!user) return false
                // Superusers have all permissions
                if (user.is_superuser) return true
                return user.permissions?.includes(permission) || false
            },

            hasRole: (role) => {
                const { user } = get()
                if (!user) return false
                // Superusers have all roles
                if (user.is_superuser) return true
                return user.roles?.includes(role) || false
            },

            hasAnyPermission: (...permissions) => {
                const { user } = get()
                if (!user) return false
                // Superusers have all permissions
                if (user.is_superuser) return true
                return permissions.some((p) => user.permissions?.includes(p))
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                tokens: state.tokens,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                // Tenant is intentionally NOT persisted to prevent spoofing from localStorage
            }),
            // Rehydrate isAuthenticated based on user presence
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Ensure isAuthenticated is derived from user/tokens after hydration
                    state.isAuthenticated = !!(state.user && state.tokens?.access)
                    state.isLoading = false
                }
            },
        }
    )
)

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useOrganization = () => useAuthStore((state) => state.organization)
export const useMenuItems = () => useAuthStore((state) => state.menuItems)
export const useHasPermission = (permission: string) =>
    useAuthStore((state) => state.hasPermission(permission))
