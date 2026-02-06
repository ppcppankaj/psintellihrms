/**
 * Workflow Service - API calls for workflow and approvals management
 */

import { api } from './api'

// Types
export interface WorkflowStep {
    id: string
    order: number
    name: string
    approver_type: 'role' | 'user' | 'manager' | 'skip_level_manager'
    approver_role?: { id: string; name: string }
    approver_user?: { id: string; full_name: string }
    status: 'pending' | 'approved' | 'rejected' | 'skipped'
    completed_at?: string
    completed_by?: { id: string; full_name: string }
    comments?: string
}

export interface ApprovalRequest {
    id: string
    request_type: 'leave' | 'attendance' | 'expense' | 'timesheet' | 'resignation' | 'loan'
    request_id: string
    title: string
    description?: string
    requester: {
        id: string
        employee_id: string
        full_name: string
        avatar?: string
        department: string
        designation: string
    }
    current_step: number
    total_steps: number
    status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    sla_deadline?: string
    is_overdue: boolean
    steps: WorkflowStep[]
    created_at: string
    updated_at: string
    metadata?: Record<string, any>
}

export interface ApprovalAction {
    action: 'approve' | 'reject' | 'delegate' | 'request_info'
    comments?: string
    delegate_to?: string
}

export interface WorkflowStats {
    pending_count: number
    approved_today: number
    rejected_today: number
    overdue_count: number
    avg_turnaround_hours: number
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

class WorkflowService {
    private basePath = '/workflows/instances'

    // Get pending approvals for current user
    async getMyPendingApprovals(): Promise<ApprovalRequest[]> {
        // Backend 'my-approvals' endpoint already filters for in_progress items assigned to user
        const response = await api.get<PaginatedResponse<ApprovalRequest> | ApprovalRequest[]>(`${this.basePath}/my-approvals/`)

        // Handle potential array or paginated response
        if (Array.isArray(response.data)) {
            return response.data
        }
        return response.data.results || []
    }

    // Get all my approvals (with filters)
    async getMyApprovals(params?: { status?: string; type?: string }): Promise<PaginatedResponse<ApprovalRequest>> {
        const response = await api.get<PaginatedResponse<ApprovalRequest>>(`${this.basePath}/my-approvals/`, { params })
        return response.data
    }

    // Get team requests (subordinates' requests)
    async getTeamRequests(params?: { status?: string }): Promise<PaginatedResponse<ApprovalRequest>> {
        const response = await api.get<PaginatedResponse<ApprovalRequest>>(`${this.basePath}/team-requests/`, { params })
        return response.data
    }

    // Get workflow history
    async getWorkflowHistory(params?: { page?: number; type?: string }): Promise<PaginatedResponse<ApprovalRequest>> {
        const response = await api.get<PaginatedResponse<ApprovalRequest>>(`${this.basePath}/workflow-history/`, { params })
        return response.data
    }

    // Get single approval detail
    async getApprovalDetail(id: string): Promise<ApprovalRequest> {
        // Backend standard viewset detail lookup
        const response = await api.get<ApprovalRequest>(`${this.basePath}/${id}/`)
        return response.data
    }

    // Take action on approval
    async takeAction(approvalId: string, actionData: ApprovalAction): Promise<ApprovalRequest> {
        let endpoint = ''

        switch (actionData.action) {
            case 'approve':
                endpoint = 'approve'
                break
            case 'reject':
                endpoint = 'reject'
                break
            default:
                // Fallback or error if other actions aren't yet supported by specific endpoints
                // Ideally we should throw error or use a generic endpoint if it existed
                throw new Error(`Action ${actionData.action} not supported by backend yet`)
        }

        const response = await api.post<ApprovalRequest>(`${this.basePath}/${approvalId}/${endpoint}/`, {
            comments: actionData.comments
        })
        return response.data
    }

    // Get workflow stats
    async getStats(): Promise<WorkflowStats> {
        const response = await api.get<WorkflowStats>(`${this.basePath}/stats/`)
        return response.data
    }

    // Get overdue approvals
    async getOverdueApprovals(): Promise<ApprovalRequest[]> {
        const response = await api.get<PaginatedResponse<ApprovalRequest>>(`${this.basePath}/my-approvals/`, {
            params: { is_overdue: true }
        })
        return response.data.results || response.data
    }
}

export const workflowService = new WorkflowService()
