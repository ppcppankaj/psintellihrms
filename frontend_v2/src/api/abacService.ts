/**
 * ABAC Service - API for roles, policies, permissions (Attribute-Based Access Control)
 */
import api from './index';

export interface Role {
    id: string;
    name: string;
    code: string;
    description: string;
    is_system_role: boolean;
    is_active: boolean;
    permissions: string[];
}

export interface Permission {
    id: string;
    name: string;
    code: string;
    resource_type: string;
    action: string;
    description: string;
}

export interface Policy {
    id: string;
    name: string;
    code: string;
    description: string;
    effect: 'allow' | 'deny';
    priority: number;
    is_active: boolean;
    valid_from?: string;
    valid_until?: string;
}

export interface PolicyRule {
    id: string;
    policy: string;
    attribute_type: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: string;
    is_active: boolean;
}

export interface UserRole {
    id: string;
    user: string;
    user_name?: string;
    role: string;
    role_name?: string;
    assigned_by?: string;
    assigned_at: string;
}

export const abacService = {
    // Roles
    getRoles: async () => {
        const response = await api.get('/abac/roles/');
        return response.data;
    },

    getRole: async (id: string) => {
        const response = await api.get(`/abac/roles/${id}/`);
        return response.data;
    },

    createRole: async (data: Partial<Role>) => {
        const response = await api.post('/abac/roles/', data);
        return response.data;
    },

    updateRole: async (id: string, data: Partial<Role>) => {
        const response = await api.put(`/abac/roles/${id}/`, data);
        return response.data;
    },

    deleteRole: async (id: string) => {
        await api.delete(`/abac/roles/${id}/`);
    },

    // Permissions
    getPermissions: async () => {
        const response = await api.get('/abac/permissions/');
        return response.data;
    },

    // Policies
    getPolicies: async () => {
        const response = await api.get('/abac/policies/');
        return response.data;
    },

    getPolicy: async (id: string) => {
        const response = await api.get(`/abac/policies/${id}/`);
        return response.data;
    },

    createPolicy: async (data: Partial<Policy>) => {
        const response = await api.post('/abac/policies/', data);
        return response.data;
    },

    updatePolicy: async (id: string, data: Partial<Policy>) => {
        const response = await api.put(`/abac/policies/${id}/`, data);
        return response.data;
    },

    deletePolicy: async (id: string) => {
        await api.delete(`/abac/policies/${id}/`);
    },

    // Policy Rules
    getPolicyRules: async (policyId: string) => {
        const response = await api.get('/abac/policy-rules/', { params: { policy: policyId } });
        return response.data;
    },

    createPolicyRule: async (data: Partial<PolicyRule>) => {
        const response = await api.post('/abac/policy-rules/', data);
        return response.data;
    },

    deletePolicyRule: async (id: string) => {
        await api.delete(`/abac/policy-rules/${id}/`);
    },

    // User Roles
    getUserRoles: async (userId?: string) => {
        const params = userId ? { user: userId } : {};
        const response = await api.get('/abac/user-roles/', { params });
        return response.data;
    },

    assignRole: async (data: { user: string; role: string }) => {
        const response = await api.post('/abac/user-roles/', data);
        return response.data;
    },

    removeUserRole: async (id: string) => {
        await api.delete(`/abac/user-roles/${id}/`);
    }
};

export default abacService;
