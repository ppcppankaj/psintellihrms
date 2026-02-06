/**
 * Auth Service - Authentication API calls
 */

import { api, apiPost } from './api'
import type { LoginCredentials, LoginResponse, User, AuthTokens } from '@/types'

export const authService = {
    /**
     * Login with email and password
     */
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await apiPost<LoginResponse>('/auth/login/', credentials)
        return response
    },

    /**
     * Verify 2FA code
     */
    verify2FA: async (code: string, sessionId: string): Promise<LoginResponse> => {
        const response = await apiPost<LoginResponse>('/auth/2fa/verify/', {
            code,
            session_id: sessionId,
        })
        return response
    },

    /**
     * Logout
     */
    logout: async (): Promise<void> => {
        try {
            await apiPost('/auth/logout/')
        } catch {
            // Ignore errors on logout
        }
    },

    /**
     * Refresh access token
     */
    refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
        const response = await api.post<AuthTokens>('/auth/token/refresh/', {
            refresh: refreshToken,
        })
        return response.data
    },

    /**
     * Get current user profile
     */
    getMe: async (): Promise<User> => {
        const response = await api.get<{ data: User }>('/auth/me/')
        return response.data.data
    },

    /**
     * Request password reset
     */
    forgotPassword: async (email: string): Promise<void> => {
        await apiPost('/auth/password/reset/', { email })
    },

    /**
     * Reset password with token
     */
    resetPassword: async (token: string, password: string): Promise<void> => {
        await apiPost('/auth/password/reset/confirm/', { token, password })
    },

    /**
     * Change password
     */
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await apiPost('/auth/password/change/', {
            current_password: currentPassword,
            new_password: newPassword,
        })
    },

    /**
     * Enable 2FA
     */
    enable2FA: async (): Promise<{ secret: string; qr_code: string }> => {
        const response = await apiPost<{ secret: string; qr_code: string }>('/auth/2fa/enable/')
        return response
    },

    /**
     * Confirm 2FA setup
     */
    confirm2FA: async (code: string): Promise<{ backup_codes: string[] }> => {
        const response = await apiPost<{ backup_codes: string[] }>('/auth/2fa/confirm/', { code })
        return response
    },

    /**
     * Disable 2FA
     */
    disable2FA: async (code: string): Promise<void> => {
        await apiPost('/auth/2fa/disable/', { code })
    },

    /**
     * Get user menu items based on permissions
     */
    getMenuItems: async () => {
        const response = await api.get<{ data: unknown[] }>('/auth/menu/')
        return response.data.data
    },
}
