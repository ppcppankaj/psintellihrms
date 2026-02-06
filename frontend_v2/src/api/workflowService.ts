/**
 * Workflow Service - API for workflow definitions, steps, instances
 */
import api from './index';

export interface WorkflowDefinition {
    id: string;
    name: string;
    code: string;
    description: string;
    entity_type: string;
    steps: WorkflowStep[];
    conditions: Record<string, unknown>;
    sla_hours?: number;
    auto_approve_on_sla: boolean;
    is_active: boolean;
}

export interface WorkflowStep {
    id: string;
    workflow: string;
    order: number;
    name: string;
    approver_type: 'reporting_manager' | 'hr_manager' | 'department_head' | 'role' | 'user';
    approver_role?: string;
    approver_user?: string;
    is_optional: boolean;
    can_delegate: boolean;
    sla_hours?: number;
}

export interface WorkflowInstance {
    id: string;
    workflow: string;
    workflow_name?: string;
    entity_type: string;
    entity_id: string;
    current_step: number;
    status: 'in_progress' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
    started_at: string;
    completed_at?: string;
    current_approver?: string;
    current_approver_name?: string;
}

export interface WorkflowAction {
    id: string;
    instance: string;
    step: number;
    actor?: string;
    actor_name?: string;
    action: 'approved' | 'rejected' | 'forwarded' | 'delegated' | 'escalated';
    comments: string;
    created_at: string;
}

export const workflowService = {
    // Workflow Definitions
    getWorkflows: async () => {
        const response = await api.get('/workflows/definitions/');
        return response.data;
    },

    getWorkflow: async (id: string) => {
        const response = await api.get(`/workflows/definitions/${id}/`);
        return response.data;
    },

    createWorkflow: async (data: Partial<WorkflowDefinition>) => {
        const response = await api.post('/workflows/definitions/', data);
        return response.data;
    },

    updateWorkflow: async (id: string, data: Partial<WorkflowDefinition>) => {
        const response = await api.put(`/workflows/definitions/${id}/`, data);
        return response.data;
    },

    deleteWorkflow: async (id: string) => {
        await api.delete(`/workflows/definitions/${id}/`);
    },

    // Workflow Steps
    getSteps: async (workflowId: string) => {
        const response = await api.get('/workflows/steps/', { params: { workflow: workflowId } });
        return response.data;
    },

    createStep: async (data: Partial<WorkflowStep>) => {
        const response = await api.post('/workflows/steps/', data);
        return response.data;
    },

    updateStep: async (id: string, data: Partial<WorkflowStep>) => {
        const response = await api.put(`/workflows/steps/${id}/`, data);
        return response.data;
    },

    deleteStep: async (id: string) => {
        await api.delete(`/workflows/steps/${id}/`);
    },

    // Workflow Instances
    getInstances: async (status?: string) => {
        const params = status ? { status } : {};
        const response = await api.get('/workflows/instances/', { params });
        return response.data;
    },

    getInstance: async (id: string) => {
        const response = await api.get(`/workflows/instances/${id}/`);
        return response.data;
    },

    // Workflow Actions
    getActions: async (instanceId: string) => {
        const response = await api.get('/workflows/actions/', { params: { instance: instanceId } });
        return response.data;
    },

    approveStep: async (instanceId: string, comments?: string) => {
        const response = await api.post(`/workflows/instances/${instanceId}/approve/`, { comments });
        return response.data;
    },

    rejectStep: async (instanceId: string, comments: string) => {
        const response = await api.post(`/workflows/instances/${instanceId}/reject/`, { comments });
        return response.data;
    },

    delegateStep: async (instanceId: string, toUserId: string, comments?: string) => {
        const response = await api.post(`/workflows/instances/${instanceId}/delegate/`, { to_user: toUserId, comments });
        return response.data;
    },

    // Pending approvals for current user
    getMyPendingApprovals: async () => {
        const response = await api.get('/workflows/instances/my_pending/');
        return response.data;
    }
};

export default workflowService;
