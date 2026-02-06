import { api } from './api'

export interface Integration {
    id?: string
    name: string
    provider: string
    config: Record<string, any>
    credentials?: Record<string, any>
    is_connected: boolean
    last_sync?: string | null
    created_at?: string
    updated_at?: string
}

export interface Webhook {
    id?: string
    name: string
    url: string
    secret: string
    events: string[]
    headers: Record<string, string>
    is_active: boolean
    created_at?: string
    updated_at?: string
}

export interface APIKey {
    id?: string
    name: string
    key?: string
    permissions: string[]
    rate_limit: number
    expires_at?: string | null
    last_used?: string | null
    created_at?: string
    updated_at?: string
}

const normalize = (payload: any) => {
    if (!payload) return [] as any[]
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload.results)) return payload.results
    if (Array.isArray(payload.data)) return payload.data
    return [] as any[]
}

export const integrationsService = {
    integrations: {
        list: async () => normalize((await api.get('/integrations/external/')).data),
        get: async (id: string) => (await api.get(`/integrations/external/${id}/`)).data,
        create: async (data: Integration) => (await api.post('/integrations/external/', data)).data,
        update: async (id: string, data: Partial<Integration>) =>
            (await api.patch(`/integrations/external/${id}/`, data)).data,
        delete: async (id: string) => {
            await api.delete(`/integrations/external/${id}/`)
        },
    },
    webhooks: {
        list: async () => normalize((await api.get('/integrations/webhooks/')).data),
        get: async (id: string) => (await api.get(`/integrations/webhooks/${id}/`)).data,
        create: async (data: Webhook) => (await api.post('/integrations/webhooks/', data)).data,
        update: async (id: string, data: Partial<Webhook>) =>
            (await api.patch(`/integrations/webhooks/${id}/`, data)).data,
        delete: async (id: string) => {
            await api.delete(`/integrations/webhooks/${id}/`)
        },
    },
    apiKeys: {
        list: async () => normalize((await api.get('/integrations/api-keys/')).data),
        get: async (id: string) => (await api.get(`/integrations/api-keys/${id}/`)).data,
        create: async (data: APIKey) => (await api.post('/integrations/api-keys/', data)).data,
        update: async (id: string, data: Partial<APIKey>) =>
            (await api.patch(`/integrations/api-keys/${id}/`, data)).data,
        delete: async (id: string) => {
            await api.delete(`/integrations/api-keys/${id}/`)
        },
    },
}
