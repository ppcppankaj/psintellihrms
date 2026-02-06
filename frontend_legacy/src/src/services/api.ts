/**
 * API Service - Axios instance with auth interceptors
 * 
 * Handles:
 * - JWT token injection
 * - Tenant context (X-Tenant-Slug header)
 * - Branch context (X-Branch-ID header)
 * - Token refresh on 401
 * - Maintenance mode detection
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { useBranchStore } from '@/store/branchStore'

import { config } from '@/config/env'

// Use centralized config
const API_BASE_URL = config.API_URL

// Conditional auth debugging - only logs when VITE_DEBUG_AUTH=true in dev
const debugAuth = config.DEBUG_AUTH
    ? (...args: any[]) => console.log('[Auth]', ...args)
    : () => { }

// Tenant + Branch + maintenance guards (module scoped, no localStorage fallback)
let organizationSlug: string | null = null
let tenantReady = false
let currentBranchId: string | null = null
let maintenanceListener: ((state: { isDown: boolean; message?: string }) => void) | null = null

export const setApiTenant = (slug: string | null) => {
    organizationSlug = slug
    tenantReady = true
}

export const clearApiTenant = () => {
    organizationSlug = null
    tenantReady = false
}

/**
 * Set current branch ID for API requests
 * Called when user switches branches
 */
export const setApiBranch = (branchId: string | null) => {
    currentBranchId = branchId
}

/**
 * Clear branch context (on logout or org switch)
 */
export const clearApiBranch = () => {
    currentBranchId = null
}

/**
 * Get current branch ID
 */
export const getApiBranchId = () => currentBranchId

export const registerMaintenanceListener = (
    listener: (state: { isDown: boolean; message?: string }) => void
) => {
    maintenanceListener = listener
    return () => {
        if (maintenanceListener === listener) {
            maintenanceListener = null
        }
    }
}

const notifyMaintenance = (state: { isDown: boolean; message?: string }) => {
    maintenanceListener?.(state)
}

// Token refresh mutex - prevents race condition when multiple 401s trigger refresh
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb)
}

const onTokenRefreshed = (token: string) => {
    refreshSubscribers.forEach(cb => cb(token))
    refreshSubscribers = []
}

const onRefreshFailed = () => {
    refreshSubscribers = []
}

// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Default 30s; some endpoints override per-call (e.g., tenant create 60s)
    timeout: 30000,
})

// Request interceptor - add auth token, tenant, and branch headers
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const authState = useAuthStore.getState()
        const tokens = authState.tokens
        const user = authState.user

        // Always add auth token if available
        if (tokens?.access) {
            config.headers.Authorization = `Bearer ${tokens.access}`
        }

        // Auth endpoints must bypass tenant gating entirely, but still send tenant for context
        const isAuthEndpoint = config.url?.includes('/auth/')

        // Send organization ID for all endpoints (even auth, for context)
        // Backend uses X-Organization-ID for multi-tenancy isolation
        // Check both the explicitly set organization object and the user's bound organization
        const organizationId = authState.organization?.id || user?.organization?.id

        if (organizationId) {
            config.headers['X-Organization-ID'] = organizationId
        } else if (organizationSlug) {
            // Support legacy/transition header if slug is set by subdomain logic
            config.headers['X-Organization-ID'] = organizationSlug
        } else if (user?.is_superuser) {
            config.headers['X-Organization-ID'] = 'public'
        }

        // Send branch ID for tenant-scoped endpoints (skip for auth and superuser-only system wide calls)
        const branchState = useBranchStore.getState()
        const branchId = currentBranchId || branchState.currentBranch?.id

        if (branchId && !isAuthEndpoint && !user?.is_superuser) {
            config.headers['X-Branch-ID'] = branchId
        }

        if (isAuthEndpoint) {
            return config
        }

        if (!tenantReady) {
            const tenantError = new AxiosError('Tenant not resolved from subdomain', 'TENANT_NOT_READY', config)
            return Promise.reject(tenantError)
        }

        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh and tenant errors
api.interceptors.response.use(
    (response) => {
        notifyMaintenance({ isDown: false })
        return response
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Network / backend down -> surface maintenance state
        if (!error.response) {
            notifyMaintenance({ isDown: true, message: 'Backend is unreachable. Please try again soon.' })
            return Promise.reject(error)
        }

        if (error.response.status >= 500) {
            notifyMaintenance({ isDown: true, message: 'Service is currently unavailable. We are working on it.' })
        } else {
            notifyMaintenance({ isDown: false })
        }

        // SECURITY: Handle tenant mismatch (403 with tenant error)
        if (error.response?.status === 403) {
            const errorData = error.response?.data as any
            if (errorData?.error?.includes('tenant') || errorData?.message?.includes('organization')) {
                console.error('[Security] Tenant mismatch detected - forcing logout')
                const { logout } = useAuthStore.getState()
                logout()
                window.location.href = '/login?error=tenant_mismatch&message=Your%20session%20does%20not%20belong%20to%20this%20organization'
                return Promise.reject(new Error('Tenant mismatch - session terminated'))
            }
        }

        // SECURITY: Handle tenant not found (404)
        if (error.response?.status === 404) {
            const errorData = error.response?.data as any
            if (errorData?.error === 'tenant_not_found') {
                console.error('[Security] Tenant not found')
                window.location.href = '/tenant-not-found'
                return Promise.reject(new Error('Organization not found'))
            }
        }

        // SECURITY: Handle subscription issues (402)
        if (error.response?.status === 402) {
            console.error('[Security] Subscription expired or suspended')
            window.location.href = '/subscription-expired'
            return Promise.reject(new Error('Subscription expired'))
        }

        // Handle 401 - only attempt refresh when a refresh token exists; otherwise let caller handle
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const { tokens, logout, setTokens, user } = useAuthStore.getState()
            const errorData = error.response?.data as any
            const errorMessage = errorData?.error?.message || errorData?.detail || errorData?.message || ''
            const errorCode = errorData?.error?.code || errorData?.code || errorData?.error?.details?.code || ''

            // Check if it's a "user_not_found" error - common for superusers without tenant
            if (errorCode === 'user_not_found') {
                // This is expected for superusers accessing tenant-specific resources
                // Don't log or attempt refresh, just reject silently
                return Promise.reject(error)
            }

            // Check if it's a tenant context error - NOT a token issue, don't refresh
            if (errorMessage.toLowerCase().includes('tenant') ||
                errorCode === 'tenant_required' ||
                errorCode === 'tenant_context_missing') {
                debugAuth('401 is tenant context issue, not token issue - skipping refresh')
                return Promise.reject(error)
            }

            // Log other auth errors to localStorage for debugging (always stored, only console.log in debug mode)
            const errorLog = {
                timestamp: new Date().toISOString(),
                url: originalRequest.url,
                method: originalRequest.method,
                status: error.response?.status,
                hasRefreshToken: !!tokens?.refresh,
                errorData: error.response?.data,
                isSuperuser: user?.is_superuser
            }
            localStorage.setItem('auth_error_log', JSON.stringify(errorLog))
            debugAuth('Error logged:', errorLog)

            // If there's no refresh token (e.g., invalid login or already logged out), surface the error to the caller
            if (!tokens?.refresh) {
                debugAuth('401 error but no refresh token available')
                return Promise.reject(error)
            }

            // Use mutex to prevent multiple simultaneous refresh attempts
            if (isRefreshing) {
                debugAuth('Refresh already in progress, waiting...')
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((newToken: string) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`
                        resolve(api(originalRequest))
                    })
                })
            }

            isRefreshing = true
            debugAuth('Attempting token refresh...')

            try {
                const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                    refresh: tokens.refresh,
                })

                // Handle both wrapped and direct token response
                const newTokens = response.data.tokens || response.data
                debugAuth('Token refresh successful')
                setTokens(newTokens)

                isRefreshing = false
                onTokenRefreshed(newTokens.access)

                originalRequest.headers.Authorization = `Bearer ${newTokens.access}`
                return api(originalRequest)
            } catch (refreshError: any) {
                isRefreshing = false
                onRefreshFailed()

                const refreshErrorLog = {
                    timestamp: new Date().toISOString(),
                    error: 'Token refresh failed',
                    status: refreshError?.response?.status,
                    data: refreshError?.response?.data,
                    message: refreshError?.message
                }
                localStorage.setItem('refresh_error_log', JSON.stringify(refreshErrorLog))
                debugAuth('Token refresh failed:', refreshErrorLog)

                // Only logout if it's not a user_not_found error
                const refreshErrorData = refreshError?.response?.data as any
                if (refreshErrorData?.error?.code !== 'user_not_found' && refreshErrorData?.error?.details?.code !== 'user_not_found') {
                    // Refresh failed - logout and redirect to login
                    logout()
                    const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search)
                    window.location.href = `/login?redirect=${redirectUrl}`
                }

                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

// API helper functions
export const apiGet = <T>(url: string, params?: Record<string, unknown>) =>
    api.get<T>(url, { params }).then((res) => res.data)

export const apiPost = <T>(url: string, data?: unknown) =>
    api.post<T>(url, data).then((res) => res.data)

export const apiPut = <T>(url: string, data?: unknown) =>
    api.put<T>(url, data).then((res) => res.data)

export const apiPatch = <T>(url: string, data?: unknown) =>
    api.patch<T>(url, data).then((res) => res.data)

export const apiDelete = <T>(url: string) =>
    api.delete<T>(url).then((res) => res.data)

// File upload helper
export const apiUpload = <T>(
    url: string,
    file: File,
    data?: Record<string, unknown>,
    onProgress?: (progress: number) => void
) => {
    const formData = new FormData()
    formData.append('file', file)

    if (data) {
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value))
        })
    }

    return api.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                onProgress(progress)
            }
        },
    }).then((res) => res.data)
}
