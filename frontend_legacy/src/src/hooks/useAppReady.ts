import { useAuthStore } from '@/store/authStore'
import { useOrganizationContext } from '@/context/TenantProvider'

/**
 * App readiness = authenticated and organization resolved to ready.
 * For superusers: only requires authentication (no organization needed).
 * For regular users: requires authentication + organization ready.
 */
export const useAppReady = () => {
    const { tokens, user } = useAuthStore()
    const { organizationSlug, status } = useOrganizationContext()

    // Superusers only need authentication (they work in public schema)
    if (user?.is_superuser) {
        return Boolean(tokens?.access)
    }

    // Regular users need authentication + organization ready
    return Boolean(tokens?.access && organizationSlug && status === 'ready')
}

/**
 * Check if app is ready for ORGANIZATION-SCOPED operations only.
 * Returns false for superusers to prevent 401 errors on organization endpoints.
 */
export const useOrganizationContextReady = () => {
    const { tokens, user } = useAuthStore()
    const { organizationSlug, status } = useOrganizationContext()

    // Superusers should NOT access organization-scoped endpoints
    if (user?.is_superuser) {
        return false
    }

    return Boolean(tokens?.access && organizationSlug && status === 'ready')
}
