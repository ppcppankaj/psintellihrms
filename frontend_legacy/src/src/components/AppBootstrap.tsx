import { useEffect, useMemo, useRef, useState } from 'react'
import { useOrganizationContext } from '@/context/TenantProvider'
import { registerMaintenanceListener } from '@/services/api'
import { authService } from '@/services/authService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import MaintenanceFallback from '@/components/MaintenanceFallback'
import { useAuthStore } from '@/store/authStore'
import { config } from '@/config/env'

// Debug logging - only enabled with VITE_DEBUG_AUTH=true in dev
const debug = config.DEBUG_AUTH
    ? (...args: any[]) => console.log('[Bootstrap]', ...args)
    : () => { }

interface AppBootstrapProps {
    children: React.ReactNode
}

const FullscreenMessage = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="max-w-md w-full space-y-4 text-center bg-white dark:bg-surface-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white">{title}</h2>
            <p className="text-surface-600 dark:text-surface-300">{description}</p>
            {action}
        </div>
    </div>
)

export const AppBootstrap = ({ children }: AppBootstrapProps) => {
    const { organizationSlug, status: orgStatus, error: orgError, refreshOrganization } = useOrganizationContext()
    const { tokens, user, isAuthenticated, setUser, logout } = useAuthStore()
    const [bootState, setBootState] = useState<'resolving-org' | 'checking-auth' | 'ready' | 'error' | 'maintenance'>('resolving-org')
    const [bootError, setBootError] = useState<string | null>(null)
    const [maintenance, setMaintenance] = useState<{ isDown: boolean; message?: string }>({ isDown: false })

    // Track if we've already validated this session to prevent re-running
    const hasValidatedRef = useRef(false)

    // Hook into API guard maintenance events
    useEffect(() => {
        const unregister = registerMaintenanceListener((state) => {
            if (state.isDown) {
                setMaintenance({ isDown: true, message: state.message })
                setBootState('maintenance')
            } else {
                setMaintenance({ isDown: false })
                setBootState((prev) => (prev === 'maintenance' ? 'ready' : prev))
            }
        })
        return unregister
    }, [])

    // Resolve organization + auth before rendering app
    useEffect(() => {
        debug('Effect running:', {
            orgStatus,
            isAuthenticated,
            hasUser: !!user,
            hasTokens: !!tokens?.access,
            hasValidated: hasValidatedRef.current
        })

        if (orgStatus === 'pending') {
            setBootState('resolving-org')
            return
        }

        if (orgStatus === 'error') {
            setBootState('error')
            setBootError(orgError || 'Unable to resolve organization')
            return
        }

        const initializeAuth = async () => {
            // If user is already authenticated and we've validated, skip re-validation
            if (isAuthenticated && user && hasValidatedRef.current) {
                debug('Already validated, skipping')
                setBootState('ready')
                return
            }

            // No tokens - nothing to validate, just mark ready
            if (!tokens?.access && !tokens?.refresh) {
                debug('No tokens, marking ready')
                setBootState('ready')
                return
            }

            // If we already have a user from persisted state, trust it initially
            // This prevents unnecessary API calls and logout on refresh
            if (isAuthenticated && user) {
                debug('User exists, trusting persisted state')
                hasValidatedRef.current = true
                setBootState('ready')
                return
            }

            debug('Will call getMe()')
            setBootState('checking-auth')

            try {
                debug('Calling authService.getMe()')
                const fetchedUser = await authService.getMe()
                debug('getMe() succeeded:', fetchedUser?.email)
                setUser(fetchedUser)
                // If user has organization, ensure authStore is aware
                if (fetchedUser.organization && useAuthStore.getState().setOrganization) {
                    useAuthStore.getState().setOrganization(fetchedUser.organization)
                }
                hasValidatedRef.current = true
                setBootState('ready')
            } catch (err: any) {
                // Log error to localStorage for debugging (always stored)
                const bootErrorLog = {
                    timestamp: new Date().toISOString(),
                    message: err?.message || 'Unknown error',
                    code: err?.code,
                    status: err?.response?.status,
                    data: err?.response?.data,
                    hasTokens: { access: !!tokens?.access, refresh: !!tokens?.refresh }
                }

                try {
                    localStorage.setItem('bootstrap_error_log', JSON.stringify(bootErrorLog))
                } catch {
                    // localStorage write failed - silently ignore
                }

                debug('getMe() FAILED:', bootErrorLog)

                logout()
                setBootError('Session expired. Please sign in again.')
                setBootState('error')
            }
        }

        void initializeAuth()
    }, [orgStatus, orgError, tokens?.access, user, isAuthenticated, setUser, logout])

    const loadingLabel = useMemo(() => {
        if (bootState === 'resolving-org') return 'Resolving organization...'
        if (bootState === 'checking-auth') return 'Validating session...'
        return 'Loading...'
    }, [bootState])

    if (bootState === 'maintenance' && maintenance.isDown) {
        return <MaintenanceFallback message={maintenance.message} onRetry={refreshOrganization} />
    }

    if (bootState === 'resolving-org' || bootState === 'checking-auth') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-surface-500">{loadingLabel}</p>
                    {organizationSlug && <p className="text-xs text-surface-400 mt-2">Organization: {organizationSlug}</p>}
                </div>
            </div>
        )
    }

    if (bootState === 'error') {
        return (
            <FullscreenMessage
                title="We could not start the app"
                description={bootError || 'Please retry or contact support.'}
                action={
                    <div className="flex gap-3 justify-center">
                        <button
                            className="px-4 py-2 rounded bg-surface-900 text-white text-sm"
                            onClick={() => refreshOrganization()}
                        >
                            Retry
                        </button>
                        <button
                            className="px-4 py-2 rounded bg-surface-200 text-surface-800 text-sm"
                            onClick={() => (window.location.href = '/login')}
                        >
                            Go to login
                        </button>
                    </div>
                }
            />
        )
    }

    return <>{children}</>
}

export default AppBootstrap
