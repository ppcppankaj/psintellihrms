import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useUserProfile } from '@/hooks/useAccessControl'
import ESSPortal from './ESSPortal'
import {
    ClockIcon,
    PresentationChartLineIcon,
    ShieldCheckIcon,
    Bars3CenterLeftIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
    const { user, hasPermission, tenant } = useAuthStore()
    const { profile } = useUserProfile()
    const [greeting, setGreeting] = useState('')

    // Set greeting based on time
    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good morning')
        else if (hour < 17) setGreeting('Good afternoon')
        else setGreeting('Good evening')
    }, [])

    // Redirect superusers in public schema to superadmin dashboard
    // MUST be after all hooks to comply with Rules of Hooks
    const isPublicSchema = profile?.current_tenant?.is_public === true
    if (user?.is_superuser && isPublicSchema) {
        return <Navigate to="/admin/dashboard" replace />
    }

    return (
        <div className="space-y-8">
            {/* Header / Welcome Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-surface-900 dark:text-white">
                        {greeting}, {user?.first_name}! 👋
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mt-2 max-w-2xl">
                        Welcome to unified HR portal. Here you can manage your attendance,
                        leaves, performance reviews, and professional development.
                    </p>
                </div>

                {/* Admin/Manager Fast Switches */}
                <div className="flex flex-wrap gap-3">
                    {hasPermission('attendance.view_team') && (
                        <Link to="/manager/dashboard" className="btn-secondary py-2 px-4 text-sm flex items-center">
                            <PresentationChartLineIcon className="w-4 h-4 mr-2" />
                            Manager Dashboard
                        </Link>
                    )}
                    {(hasPermission('employees.view_all') || hasPermission('rbac.manage')) && (
                        <Link to="/hr/analytics" className="btn-secondary py-2 px-4 text-sm flex items-center bg-surface-900 text-white hover:bg-black">
                            <ShieldCheckIcon className="w-4 h-4 mr-2" />
                            HR Analytics
                        </Link>
                    )}
                    <Link to="/attendance" className="btn-primary py-2 px-4 text-sm flex items-center shadow-lg shadow-primary-500/20">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        Punch In/Out
                    </Link>
                </div>
            </div>

            {/* Main ESS Content */}
            <ESSPortal />

            {/* Bottom Section: Feed / Quick Links for Power Users */}
            {(hasPermission('onboarding.manage') || hasPermission('expenses.approve')) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg mr-4">
                                <Bars3CenterLeftIcon className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-primary-900 dark:text-primary-100">Management Action Center</h3>
                                <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                                    You have pending approvals for onboarding tasks and expense claims.
                                </p>
                            </div>
                        </div>
                        <Link to="/manager/dashboard" className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center">
                            Review Now <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
    )
}
