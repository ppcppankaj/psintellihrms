import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setApiTenant } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

interface OrganizationContextValue {
    organizationSlug: string | null
    status: 'pending' | 'ready' | 'error'
    error?: string | null
    refreshOrganization: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined)

const deriveOrganizationFromHostname = (hostname: string): string | null => {
    const sanitizedHost = hostname.trim().toLowerCase()

    // Local development: fall back to public schema
    if (sanitizedHost === 'localhost' || sanitizedHost.startsWith('127.')) {
        return 'public'
    }

    const parts = sanitizedHost.split('.').filter(Boolean)

    // For hosts like app.acme.example.com -> tenant is parts[0]
    if (parts.length >= 3) {
        return parts[0]
    }

    // For two-part hosts (acme.local) assume first part is tenant
    if (parts.length === 2) {
        return parts[0]
    }

    return null
}

export const OrganizationProvider = ({ children }: { children: React.ReactNode }) => {
    const [organizationSlug, setOrganizationSlug] = useState<string | null>(null)
    const [status, setStatus] = useState<'pending' | 'ready' | 'error'>('pending')
    const [error, setError] = useState<string | null>(null)
    const user = useAuthStore((state) => state.user)

    const resolveOrganization = useCallback(async () => {
        setStatus('pending')
        setError(null)

        const resolved = deriveOrganizationFromHostname(window.location.hostname)

        if (!resolved) {
            setStatus('error')
            setError('Unable to resolve organization context from subdomain')
            setApiTenant(null)
            return
        }

        setOrganizationSlug(resolved)
        setApiTenant(resolved)
        setStatus('ready')
    }, [])

    useEffect(() => {
        void resolveOrganization()
    }, [resolveOrganization])

    // Superusers should default to public schema even on tenant subdomains
    useEffect(() => {
        if (user?.is_superuser && organizationSlug !== 'public') {
            setOrganizationSlug('public')
            setApiTenant('public')
            setStatus('ready')
            setError(null)
        }
    }, [user?.is_superuser, organizationSlug])

    const value = useMemo(
        () => ({ organizationSlug, status, error, refreshOrganization: resolveOrganization }),
        [organizationSlug, status, error, resolveOrganization]
    )

    return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
}

export const useOrganizationContext = () => {
    const ctx = useContext(OrganizationContext)
    if (!ctx) {
        throw new Error('useOrganizationContext must be used within OrganizationProvider')
    }
    return ctx
}
