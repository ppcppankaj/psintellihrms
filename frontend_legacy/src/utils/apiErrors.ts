/**
 * API Error Utilities - Type-safe error handling
 */

import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

export interface ApiErrorResponse {
    detail?: string
    message?: string
    errors?: Record<string, string[]>
    non_field_errors?: string[]
}

export const handleApiError = (error: unknown, fallbackMessage = 'An error occurred') => {
    const axiosError = error as AxiosError<ApiErrorResponse>

    if (!axiosError.response) {
        toast.error('Network error. Please check your connection.')
        return
    }

    const { status, data } = axiosError.response

    switch (status) {
        case 400: {
            // Validation errors
            if (data.errors) {
                Object.values(data.errors).flat().forEach(msg => toast.error(msg))
            } else if (data.non_field_errors) {
                data.non_field_errors.forEach(msg => toast.error(msg))
            } else {
                toast.error(data.detail || data.message || 'Validation error')
            }
            break
        }
        case 401:
            toast.error('Session expired. Please login again.')
            break
        case 403:
            toast.error('You do not have permission for this action')
            break
        case 404:
            toast.error('Resource not found')
            break
        case 409:
            toast.error(data.detail || 'Conflict error')
            break
        case 422:
            toast.error(data.detail || 'Unprocessable entity')
            break
        case 500:
        case 502:
        case 503:
        case 504:
            toast.error('Server error. Please try again later.')
            break
        default:
            toast.error(data.detail || data.message || fallbackMessage)
    }
}

/**
 * Extract error message from API error for display
 */
export const getApiErrorMessage = (error: unknown, fallback = 'An error occurred'): string => {
    const axiosError = error as AxiosError<ApiErrorResponse>

    if (!axiosError.response) {
        return 'Network error'
    }

    const { data } = axiosError.response
    return data.detail || data.message || fallback
}
