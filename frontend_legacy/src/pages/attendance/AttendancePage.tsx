/**
 * Attendance Page - Punch In/Out with Fraud Detection Display
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ClockIcon,
    MapPinIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    UserIcon,
} from '@heroicons/react/24/outline'
import { attendanceService } from '@/services/attendanceService'
import type { PunchRequest } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOrganizationContextReady } from '@/hooks/useAppReady'

export default function AttendancePage() {
    const isTenantReady = useOrganizationContextReady()
    const queryClient = useQueryClient()
    const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
    const [locationError, setLocationError] = useState<string | null>(null)
    const [isGettingLocation, setIsGettingLocation] = useState(true)

    // Get today's attendance (only for tenant users)
    const { data: todayAttendance, error: todayError } = useQuery({
        queryKey: ['my-attendance-today'],
        queryFn: () => attendanceService.getMyToday(),
        enabled: isTenantReady,
        retry: (failureCount, error: any) => {
            if (error.response?.status === 404) return false
            return failureCount < 3
        }
    })

    // Get summary (only for tenant users)
    const { data: summary, error: summaryError } = useQuery({
        queryKey: ['attendance-summary'],
        queryFn: () => attendanceService.getMySummary(),
        enabled: isTenantReady,
        retry: (failureCount, error: any) => {
            if (error.response?.status === 404) return false
            return failureCount < 3
        }
    })

    const isNoProfile = (todayError as any)?.response?.status === 404 || (summaryError as any)?.response?.status === 404

    // Punch in mutation
    const punchInMutation = useMutation({
        mutationFn: (data: PunchRequest) => attendanceService.punchIn(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] })
            queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })

            if (response.success) {
                if (response.warnings.length > 0) {
                    toast(response.message, { icon: '⚠️' })
                    response.warnings.forEach(w => toast(w, { icon: '⚠️' }))
                } else {
                    toast.success(response.message)
                }
            } else {
                toast.error(response.message)
            }
        },
        onError: () => {
            toast.error('Failed to punch in. Please try again.')
        },
    })

    // Punch out mutation
    const punchOutMutation = useMutation({
        mutationFn: (data: PunchRequest) => attendanceService.punchOut(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] })
            queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })

            if (response.success) {
                toast.success(response.message)
            } else {
                toast.error(response.message)
            }
        },
        onError: () => {
            toast.error('Failed to punch out. Please try again.')
        },
    })

    // Get GPS location on mount
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser')
            setIsGettingLocation(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                })
                setIsGettingLocation(false)
            },
            (error) => {
                setLocationError(`Location error: ${error.message}`)
                setIsGettingLocation(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        )
    }, [])

    const isPunchedIn = todayAttendance && 'check_in' in todayAttendance && todayAttendance.check_in
    const isPunchedOut = todayAttendance && 'check_out' in todayAttendance && todayAttendance.check_out
    const canPunchIn = !isPunchedIn
    const canPunchOut = isPunchedIn && !isPunchedOut

    const handlePunch = (type: 'in' | 'out') => {
        if (!location) {
            toast.error('Location is required for attendance')
            return
        }

        const punchData: PunchRequest = {
            latitude: location.lat,
            longitude: location.lng,
            accuracy: location.accuracy,
            device_id: navigator.userAgent,
            device_model: navigator.platform,
            is_rooted: false,
            is_emulator: false,
            is_mock_gps: false,
        }

        if (type === 'in') {
            punchInMutation.mutate(punchData)
        } else {
            punchOutMutation.mutate(punchData)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Attendance
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Punch in/out and view your attendance history
                </p>
            </div>

            {isNoProfile ? (
                <div className="card p-8 text-center max-w-2xl mx-auto">
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <UserIcon className="w-10 h-10 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">No Employee Profile Found</h2>
                    <p className="text-surface-600 dark:text-surface-400 mb-6">
                        Personal attendance tracking is only available for accounts linked to an employee profile.
                        If you believe this is an error, please contact your HR administrator.
                    </p>
                    <div className="flex justify-center gap-4">
                        <a href="/" className="btn-secondary">Go to Dashboard</a>
                    </div>
                </div>
            ) : (
                <>

                    {/* Punch Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-primary-100 text-sm">Today</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {new Date().toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-mono font-bold">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Location status */}
                            <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
                                <div className="flex items-center">
                                    <MapPinIcon className="w-5 h-5 text-surface-500 mr-3" />
                                    {isGettingLocation ? (
                                        <span className="text-surface-600">Getting location...</span>
                                    ) : locationError ? (
                                        <span className="text-red-500">{locationError}</span>
                                    ) : (
                                        <span className="text-surface-600 dark:text-surface-300">
                                            Location acquired ({location?.accuracy?.toFixed(0)}m accuracy)
                                        </span>
                                    )}
                                </div>
                                {location && (
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                )}
                            </div>

                            {/* Punch times */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
                                    <p className="text-sm text-surface-500">Check In</p>
                                    <p className="text-xl font-bold text-surface-900 dark:text-white mt-1">
                                        {isPunchedIn && 'check_in' in todayAttendance && todayAttendance.check_in
                                            ? new Date(todayAttendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '--:--'}
                                    </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
                                    <p className="text-sm text-surface-500">Check Out</p>
                                    <p className="text-xl font-bold text-surface-900 dark:text-white mt-1">
                                        {isPunchedOut && 'check_out' in todayAttendance && todayAttendance.check_out
                                            ? new Date(todayAttendance.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '--:--'}
                                    </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-700/50">
                                    <p className="text-sm text-surface-500">Hours</p>
                                    <p className="text-xl font-bold text-surface-900 dark:text-white mt-1">
                                        {todayAttendance && 'total_hours' in todayAttendance && todayAttendance.total_hours
                                            ? `${todayAttendance.total_hours}h`
                                            : '0h'}
                                    </p>
                                </div>
                            </div>

                            {/* Fraud warning */}
                            {todayAttendance && 'is_flagged' in todayAttendance && todayAttendance.is_flagged && (
                                <div className="flex items-center p-4 mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-3" />
                                    <span className="text-yellow-800 dark:text-yellow-200">
                                        This attendance record has been flagged for review
                                    </span>
                                </div>
                            )}

                            {/* Punch buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handlePunch('in')}
                                    disabled={!canPunchIn || !location || punchInMutation.isPending}
                                    className="flex-1 py-4 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {punchInMutation.isPending ? (
                                        <LoadingSpinner size="sm" className="mx-auto text-white" />
                                    ) : (
                                        <>
                                            <ClockIcon className="w-5 h-5 inline mr-2" />
                                            Punch In
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handlePunch('out')}
                                    disabled={!canPunchOut || !location || punchOutMutation.isPending}
                                    className="flex-1 py-4 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {punchOutMutation.isPending ? (
                                        <LoadingSpinner size="sm" className="mx-auto text-white" />
                                    ) : (
                                        <>
                                            <ClockIcon className="w-5 h-5 inline mr-2" />
                                            Punch Out
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Monthly Summary */}
                    {summary && (
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                                This Month's Summary
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-green-600">{summary.present_days}</p>
                                    <p className="text-sm text-surface-500">Present</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-red-600">{summary.absent_days}</p>
                                    <p className="text-sm text-surface-500">Absent</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-yellow-600">{summary.late_days}</p>
                                    <p className="text-sm text-surface-500">Late</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-blue-600">{summary.leave_days}</p>
                                    <p className="text-sm text-surface-500">Leaves</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
