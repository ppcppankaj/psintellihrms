/**
 * ABAC Service - API calls for attribute-based access control
 */

import { api } from './api'

// ==================== ATTRIBUTE TYPES ====================
export interface AttributeType {
    id: string
    code: string
    name: string
    category: 'subject' | 'resource' | 'action' | 'environment'
    description: string
    is_active: boolean
    values: string[]
    created_at: string
    updated_at: string
}

export interface AttributeTypeInput {
    code: string
    name: string
    category: 'subject' | 'resource' | 'action' | 'environment'
    description?: string
    values?: string[]
}

// ==================== POLICIES ====================
export interface PolicyRule {
    id: string
    attribute_type_id: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'not_contains'
    value: string
    is_required: boolean
}

export interface PolicyRuleInput {
    attribute_type_id: string
    operator: string
    value: string
    is_required?: boolean
}

export interface Policy {
    id: string
    code: string
    name: string
    description: string
    effect: 'ALLOW' | 'DENY'
    priority: number
    rules: PolicyRule[]
    condition: 'AND' | 'OR'
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface PolicyInput {
    code: string
    name: string
    description?: string
    effect: 'ALLOW' | 'DENY'
    priority?: number
    condition?: 'AND' | 'OR'
    rules?: PolicyRuleInput[]
}

// ==================== USER POLICIES ====================
export interface UserPolicy {
    id: string
    user_id: string
    policy_id: string
    user?: {
        id: string
        email: string
        first_name: string
        last_name: string
    }
    policy?: Policy
    created_at: string
}

export interface UserPolicyInput {
    user_id: string
    policy_id: string
}

// ==================== GROUP POLICIES ====================
export interface GroupPolicy {
    id: string
    group_id: string
    policy_id: string
    group?: {
        id: string
        name: string
    }
    policy?: Policy
    created_at: string
}

export interface GroupPolicyInput {
    group_id: string
    policy_id: string
}

// ==================== POLICY LOG ====================
export interface PolicyLog {
    id: string
    user_id: string
    policy_id: string
    action: string
    resource: string
    context: Record<string, any>
    decision: 'ALLOWED' | 'DENIED'
    timestamp: string
}

// ==================== ATTRIBUTE TYPES API ====================
export const abacService = {
    // Attribute Types
    attributeTypes: {
        list: async (params?: Record<string, any>) => {
            const response = await api.get('/abac/attribute-types/', { params })
            return response.data
        },
        get: async (id: string) => {
            const response = await api.get(`/abac/attribute-types/${id}/`)
            return response.data
        },
        create: async (data: AttributeTypeInput) => {
            const response = await api.post('/abac/attribute-types/', data)
            return response.data
        },
        update: async (id: string, data: Partial<AttributeTypeInput>) => {
            const response = await api.patch(`/abac/attribute-types/${id}/`, data)
            return response.data
        },
        delete: async (id: string) => {
            await api.delete(`/abac/attribute-types/${id}/`)
        },
    },

    // Policies
    policies: {
        list: async (params?: Record<string, any>) => {
            const response = await api.get('/abac/policies/', { params })
            return response.data
        },
        get: async (id: string) => {
            const response = await api.get(`/abac/policies/${id}/`)
            return response.data
        },
        create: async (data: PolicyInput) => {
            const response = await api.post('/abac/policies/', data)
            return response.data
        },
        update: async (id: string, data: Partial<PolicyInput>) => {
            const response = await api.patch(`/abac/policies/${id}/`, data)
            return response.data
        },
        delete: async (id: string) => {
            await api.delete(`/abac/policies/${id}/`)
        },
    },

    // Policy Rules
    policyRules: {
        list: async (policyId: string) => {
            const response = await api.get(`/abac/policies/${policyId}/rules/`)
            return response.data
        },
        create: async (policyId: string, data: PolicyRuleInput) => {
            const response = await api.post(`/abac/policies/${policyId}/rules/`, data)
            return response.data
        },
        update: async (policyId: string, ruleId: string, data: Partial<PolicyRuleInput>) => {
            const response = await api.patch(`/abac/policies/${policyId}/rules/${ruleId}/`, data)
            return response.data
        },
        delete: async (policyId: string, ruleId: string) => {
            await api.delete(`/abac/policies/${policyId}/rules/${ruleId}/`)
        },
    },

    // User Policies
    userPolicies: {
        list: async (params?: Record<string, any>) => {
            const response = await api.get('/abac/user-policies/', { params })
            return response.data
        },
        get: async (id: string) => {
            const response = await api.get(`/abac/user-policies/${id}/`)
            return response.data
        },
        create: async (data: UserPolicyInput) => {
            const response = await api.post('/abac/user-policies/', data)
            return response.data
        },
        delete: async (id: string) => {
            await api.delete(`/abac/user-policies/${id}/`)
        },
        bulkAssign: async (userId: string, policyIds: string[]) => {
            const response = await api.post(`/abac/user-policies/bulk-assign/`, {
                user_id: userId,
                policy_ids: policyIds,
            })
            return response.data
        },
    },

    // Group Policies
    groupPolicies: {
        list: async (params?: Record<string, any>) => {
            const response = await api.get('/abac/group-policies/', { params })
            return response.data
        },
        get: async (id: string) => {
            const response = await api.get(`/abac/group-policies/${id}/`)
            return response.data
        },
        create: async (data: GroupPolicyInput) => {
            const response = await api.post('/abac/group-policies/', data)
            return response.data
        },
        delete: async (id: string) => {
            await api.delete(`/abac/group-policies/${id}/`)
        },
        bulkAssign: async (groupId: string, policyIds: string[]) => {
            const response = await api.post(`/abac/group-policies/bulk-assign/`, {
                group_id: groupId,
                policy_ids: policyIds,
            })
            return response.data
        },
    },

    // Policy Logs
    logs: {
        list: async (params?: Record<string, any>) => {
            const response = await api.get('/abac/policy-logs/', { params })
            return response.data
        },
        get: async (id: string) => {
            const response = await api.get(`/abac/policy-logs/${id}/`)
            return response.data
        },
    },

    // Test Access
    checkAccess: async (userId: string, action: string, resource: string, context?: Record<string, any>) => {
        const response = await api.post('/abac/check-access/', {
            user_id: userId,
            action,
            resource,
            context: context || {},
        })
        return response.data
    },
}

export default abacService
