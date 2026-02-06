/**
 * Workflow Store - Zustand state management for approvals
 */

import { create } from 'zustand'
import {
    workflowService,
    ApprovalRequest,
    WorkflowStats,
    ApprovalAction
} from '@/services/workflowService'

interface WorkflowState {
    // Pending approvals
    pendingApprovals: ApprovalRequest[]
    isLoadingPending: boolean

    // Team requests
    teamRequests: ApprovalRequest[]
    isLoadingTeam: boolean

    // History
    historyRequests: ApprovalRequest[]
    isLoadingHistory: boolean
    historyCount: number

    // Current detail
    currentApproval: ApprovalRequest | null
    isLoadingDetail: boolean

    // Stats
    stats: WorkflowStats | null

    // Actions
    fetchPendingApprovals: () => Promise<void>
    fetchTeamRequests: (status?: string) => Promise<void>
    fetchHistory: (params?: { page?: number; type?: string }) => Promise<void>
    fetchApprovalDetail: (id: string) => Promise<void>
    takeAction: (id: string, action: ApprovalAction) => Promise<void>
    fetchStats: () => Promise<void>
    clearCurrentApproval: () => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    // Initial state
    pendingApprovals: [],
    isLoadingPending: false,

    teamRequests: [],
    isLoadingTeam: false,

    historyRequests: [],
    isLoadingHistory: false,
    historyCount: 0,

    currentApproval: null,
    isLoadingDetail: false,

    stats: null,

    // Actions
    fetchPendingApprovals: async () => {
        set({ isLoadingPending: true })
        try {
            const approvals = await workflowService.getMyPendingApprovals()
            set({ pendingApprovals: approvals, isLoadingPending: false })
        } catch {
            set({ pendingApprovals: [], isLoadingPending: false })
        }
    },

    fetchTeamRequests: async (status?: string) => {
        set({ isLoadingTeam: true })
        try {
            const response = await workflowService.getTeamRequests({ status })
            set({ teamRequests: response.results, isLoadingTeam: false })
        } catch {
            set({ teamRequests: [], isLoadingTeam: false })
        }
    },

    fetchHistory: async (params) => {
        set({ isLoadingHistory: true })
        try {
            const response = await workflowService.getWorkflowHistory(params)
            set({
                historyRequests: response.results,
                historyCount: response.count,
                isLoadingHistory: false
            })
        } catch {
            set({ historyRequests: [], isLoadingHistory: false })
        }
    },

    fetchApprovalDetail: async (id: string) => {
        set({ isLoadingDetail: true })
        try {
            const approval = await workflowService.getApprovalDetail(id)
            set({ currentApproval: approval, isLoadingDetail: false })
        } catch {
            set({ currentApproval: null, isLoadingDetail: false })
        }
    },

    takeAction: async (id: string, action: ApprovalAction) => {
        const approval = await workflowService.takeAction(id, action)
        set({ currentApproval: approval })
        // Refresh lists
        await Promise.all([
            get().fetchPendingApprovals(),
            get().fetchStats()
        ])
    },

    fetchStats: async () => {
        try {
            const stats = await workflowService.getStats()
            set({ stats })
        } catch {
            // Silently fail
        }
    },

    clearCurrentApproval: () => {
        set({ currentApproval: null })
    },
}))
