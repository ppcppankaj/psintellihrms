/**
 * Branch Service - API calls for branch selection and switching
 * 
 * Endpoints:
 * - GET /auth/branches/my-branches/ - List user's accessible branches
 * - POST /auth/branches/switch-branch/ - Switch to a different branch
 * - GET /auth/branches/current-branch/ - Get current active branch
 */

import { api } from './api'
import type { Branch, Organization } from '@/store/branchStore'

export interface MyBranchesResponse {
    branches: Branch[]
    current_branch: Branch | null
    is_multi_branch: boolean
    organization: Organization | null
}

export interface SwitchBranchResponse {
    success: boolean
    message: string
    branch: Branch
}

export interface CurrentBranchResponse {
    branch: Branch
    is_default: boolean
}

export const branchService = {
    /**
     * Get list of branches accessible to the current user
     */
    getMyBranches: async (): Promise<MyBranchesResponse> => {
        const response = await api.get('/auth/branches/my-branches/')
        return response.data
    },

    /**
     * Switch to a different branch
     */
    switchBranch: async (branchId: string): Promise<SwitchBranchResponse> => {
        const response = await api.post('/auth/branches/switch-branch/', {
            branch_id: branchId,
        })
        return response.data
    },

    /**
     * Get the currently active branch
     */
    getCurrentBranch: async (): Promise<CurrentBranchResponse> => {
        const response = await api.get('/auth/branches/current-branch/')
        return response.data
    },
}
