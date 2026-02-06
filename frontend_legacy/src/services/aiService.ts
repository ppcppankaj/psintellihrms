import { api } from './api'

export interface AIModelVersion {
    id?: string
    name: string
    model_type: string
    version: string
    model_path: string
    is_active: boolean
    accuracy?: number | null
    created_at?: string
    updated_at?: string
}

export interface AIPrediction {
    id?: string
    model_version: string | AIModelVersion
    entity_type: string
    entity_id: string
    prediction: Record<string, any>
    confidence: number
    human_reviewed: boolean
    human_override?: Record<string, any> | null
    reviewed_by?: string | null
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

export const aiService = {
    models: {
        list: async () => normalize((await api.get('/ai/models/')).data),
        get: async (id: string) => (await api.get(`/ai/models/${id}/`)).data,
        create: async (data: AIModelVersion) => (await api.post('/ai/models/', data)).data,
        update: async (id: string, data: Partial<AIModelVersion>) =>
            (await api.patch(`/ai/models/${id}/`, data)).data,
        delete: async (id: string) => {
            await api.delete(`/ai/models/${id}/`)
        },
    },
    predictions: {
        list: async () => normalize((await api.get('/ai/predictions/')).data),
        get: async (id: string) => (await api.get(`/ai/predictions/${id}/`)).data,
        create: async (data: AIPrediction) => (await api.post('/ai/predictions/', data)).data,
        update: async (id: string, data: Partial<AIPrediction>) =>
            (await api.patch(`/ai/predictions/${id}/`, data)).data,
        delete: async (id: string) => {
            await api.delete(`/ai/predictions/${id}/`)
        },
    },
}
