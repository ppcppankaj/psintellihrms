import { api } from './api'

export interface AuditLog {
    id: string
    timestamp: string
    user?: {
        id: string
        email: string
    } | null
    user_email?: string | null
    action: string
    resource_type: string
    resource_id: string
    resource_repr?: string | null
    old_values?: Record<string, any> | null
    new_values?: Record<string, any> | null
    changed_fields?: string[]
    ip_address?: string | null
    user_agent?: string | null
    request_id?: string | null
    tenant_id?: string | null
}

const normalize = (payload: any) => {
    if (!payload) return [] as any[]
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload.results)) return payload.results
    if (Array.isArray(payload.data)) return payload.data
    return [] as any[]
}

export const coreService = {
    auditLogs: {
        list: async (params?: Record<string, any>) => 
            normalize((await api.get('/core/audit-logs/', { params })).data),
        get: async (id: string) => 
            (await api.get(`/core/audit-logs/${id}/`)).data,
    },
}
