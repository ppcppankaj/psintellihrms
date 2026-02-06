/**
 * Branch Store - Zustand state management for branch context
 * 
 * SECURITY: Branch data is stored in memory only (NOT localStorage)
 * to prevent spoofing and ensure proper isolation.
 */

import { create } from 'zustand'
import { useQueryClient } from '@tanstack/react-query'

export interface Branch {
    id: string
    name: string
    code: string
    type?: string
    location?: string | null
    is_headquarters?: boolean
    address?: string
    city?: string
    state?: string
    country?: string
}

export interface Organization {
    id: string
    name: string
}

interface BranchState {
    // State
    branches: Branch[]
    currentBranch: Branch | null
    organization: Organization | null
    isMultiBranch: boolean
    isLoading: boolean
    error: string | null

    // Actions
    setBranches: (branches: Branch[]) => void
    setCurrentBranch: (branch: Branch | null) => void
    setOrganization: (org: Organization | null) => void
    setIsMultiBranch: (isMulti: boolean) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    
    // Compound actions
    initializeBranchContext: (data: {
        branches: Branch[]
        current_branch: Branch | null
        is_multi_branch: boolean
        organization: Organization | null
    }) => void
    
    switchBranch: (branchId: string) => Branch | null
    clearBranchContext: () => void
    
    // Getters
    getCurrentBranchId: () => string | null
    hasBranchAccess: (branchId: string) => boolean
}

export const useBranchStore = create<BranchState>((set, get) => ({
    // Initial state - Memory only, no persistence
    branches: [],
    currentBranch: null,
    organization: null,
    isMultiBranch: false,
    isLoading: false,
    error: null,

    // Simple setters
    setBranches: (branches) => set({ branches }),
    setCurrentBranch: (branch) => set({ currentBranch: branch }),
    setOrganization: (org) => set({ organization: org }),
    setIsMultiBranch: (isMulti) => set({ isMultiBranch: isMulti }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // Initialize branch context from API response
    initializeBranchContext: (data) => {
        set({
            branches: data.branches || [],
            currentBranch: data.current_branch,
            organization: data.organization,
            isMultiBranch: data.is_multi_branch || false,
            isLoading: false,
            error: null,
        })
    },

    // Switch to a different branch (local state only - API call happens in hook)
    switchBranch: (branchId) => {
        const { branches } = get()
        const targetBranch = branches.find(b => b.id === branchId)
        
        if (targetBranch) {
            set({ currentBranch: targetBranch })
            return targetBranch
        }
        
        return null
    },

    // Clear all branch context (on logout or tenant switch)
    clearBranchContext: () => {
        set({
            branches: [],
            currentBranch: null,
            organization: null,
            isMultiBranch: false,
            isLoading: false,
            error: null,
        })
    },

    // Get current branch ID
    getCurrentBranchId: () => {
        const { currentBranch } = get()
        return currentBranch?.id || null
    },

    // Check if user has access to a specific branch
    hasBranchAccess: (branchId) => {
        const { branches } = get()
        return branches.some(b => b.id === branchId)
    },
}))

// Selector hooks for optimized re-renders
export const useCurrentBranch = () => useBranchStore((state) => state.currentBranch)
export const useBranches = () => useBranchStore((state) => state.branches)
export const useIsMultiBranch = () => useBranchStore((state) => state.isMultiBranch)
export const useOrganization = () => useBranchStore((state) => state.organization)
export const useBranchLoading = () => useBranchStore((state) => state.isLoading)

/**
 * Hook to invalidate React Query cache on branch switch.
 * Should be called after successful branch switch.
 */
export const useBranchCacheInvalidation = () => {
    const queryClient = useQueryClient()
    
    return {
        invalidateAllBranchData: () => {
            // Invalidate all queries that depend on branch context
            queryClient.invalidateQueries({ queryKey: ['employees'] })
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
            queryClient.invalidateQueries({ queryKey: ['leave'] })
            queryClient.invalidateQueries({ queryKey: ['payroll'] })
            queryClient.invalidateQueries({ queryKey: ['performance'] })
            queryClient.invalidateQueries({ queryKey: ['workflows'] })
            queryClient.invalidateQueries({ queryKey: ['assets'] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
        invalidateSpecificQueries: (queryKeys: string[]) => {
            queryKeys.forEach(key => {
                queryClient.invalidateQueries({ queryKey: [key] })
            })
        },
    }
}
