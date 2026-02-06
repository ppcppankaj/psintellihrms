import { api } from './api'

export interface DataRetentionPolicy {
    id?: string
    name: string
    entity_type: string
    retention_days: number
    action: 'archive' | 'delete' | 'anonymize'
}

export interface ConsentRecord {
    id?: string
    employee: string
    consent_type: string
    granted: boolean
    granted_at?: string | null
    revoked_at?: string | null
    ip_address?: string | null
}

export interface LegalHold {
    id?: string
    name: string
    description: string
    employees: string[]
    start_date: string
    end_date?: string | null
}

const normalize = (payload: any) => {
    if (!payload) return [] as any[]
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload.results)) return payload.results
    if (Array.isArray(payload.data)) return payload.data
    return [] as any[]
}

export const complianceService = {
    retention: {
        list: async () => normalize((await api.get('/compliance/retention/')).data),
        create: async (data: DataRetentionPolicy) => (await api.post('/compliance/retention/', data)).data,
        update: async (id: string, data: Partial<DataRetentionPolicy>) =>
            (await api.patch(`/compliance/retention/${id}/`, data)).data,
        delete: async (id: string) => {
            await api.delete(`/compliance/retention/${id}/`)
        },
    },
    consents: {
        list: async () => normalize((await api.get('/compliance/consents/')).data),
        create: async (data: ConsentRecord) => (await api.post('/compliance/consents/', data)).data,
        update: async (id: string, data: Partial<ConsentRecord>) =>
            (await api.patch(`/compliance/consents/${id}/`, data)).data,
        delete: async (id: string) => {
            await api.delete(`/compliance/consents/${id}/`)
        },
    },
    legalHolds: {
        list: async () => normalize((await api.get('/compliance/legal-holds/')).data),
        create: async (data: LegalHold) => (await api.post('/compliance/legal-holds/', data)).data,
        update: async (id: string, data: Partial<LegalHold>) =>
            (await api.patch(`/compliance/legal-holds/${id}/`, data)).data,
        delete: async (id: string) => {
            await api.delete(`/compliance/legal-holds/${id}/`)
        },
    },
}
