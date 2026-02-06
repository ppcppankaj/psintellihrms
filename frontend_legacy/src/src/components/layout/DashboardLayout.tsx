/**
 * Dashboard Layout - Main app shell with sidebar and header
 */

import { useState, useMemo, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import {
    ClockIcon,
    BellIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    MoonIcon,
    SunIcon,
    ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'

import { navigationConfig, superuserNavigation, NavItem } from '@/config/navigation'
import { useUserProfile } from '@/hooks/useAccessControl'
import { useChat } from '@/context/ChatContext'
import BranchSelector from './BranchSelector'

export default function DashboardLayout() {
    const location = useLocation()
    const navigate = useNavigate()

    // Optimize: Select only what we need to prevent validation re-renders
    const user = useAuthStore((state) => state.user)
    const tenant = useAuthStore((state) => state.tenant)
    const logout = useAuthStore((state) => state.logout)
    const hasPermission = useAuthStore((state) => state.hasPermission)

    const { totalUnreadCount } = useChat()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        document.documentElement.classList.toggle('dark')
    }

    const toggleGroup = (name: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [name]: !prev[name]
        }))
    }

    // Update document title
    useEffect(() => {
        if (tenant?.name) {
            document.title = `${tenant.name} - IntelliHR`
        } else {
            document.title = 'IntelliHR - Enterprise HRMS'
        }
    }, [tenant?.name])

    // Optimize: Memoize expensive permission filtering
    // Only re-calc if user permissions change (which usually involves user object changing or full reload)
    const { profile } = useUserProfile();
    const filteredNavigation = useMemo(() => {
        // Use superuser navigation ONLY when:
        // 1. User IS a superuser (is_superuser = true)
        // 2. AND they're in the public schema (is_public = true)
        // Regular tenant users (is_superuser = false) should ALWAYS see tenant navigation
        const isPublicSchema = profile?.current_tenant?.is_public === true;
        const isSuperuser = Boolean(user?.is_superuser);
        const useSuperNav = isSuperuser && isPublicSchema;
        
        // Debug logging (remove in production)
        if (process.env.NODE_ENV === 'development') {
            console.log('[DashboardLayout] Navigation decision:', {
                isSuperuser,
                isPublicSchema,
                useSuperNav,
                userEmail: user?.email,
                schemaName: profile?.current_tenant?.schema
            });
        }
        
        const configToUse = useSuperNav ? superuserNavigation : navigationConfig;

        const filterNav = (items: NavItem[]): NavItem[] => {
            return items
                // Hide tenant management when inside tenant schema
                .filter(item => !(item.href === '/admin/tenants' && !isPublicSchema))
                .filter(item => !item.permission || hasPermission(item.permission))
                .map(item => ({
                    ...item,
                    children: item.children ? filterNav(item.children) : undefined
                }))
                .filter(item => (item.href !== '#' || (item.children && item.children.length > 0)))
        }
        return configToUse.map(group => ({
            ...group,
            items: filterNav(group.items)
        })).filter(group => group.items.length > 0)
    }, [hasPermission, user?.roles, user?.is_superuser, user?.email, profile?.current_tenant?.is_public, profile?.current_tenant?.schema])

    const renderNavItem = (item: NavItem, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0
        const isExpanded = expandedGroups[item.name]
        const isActive = location.pathname === item.href || (hasChildren && item.children?.some(c => location.pathname === c.href))

        return (
            <div key={item.name} className="space-y-1">
                {hasChildren ? (
                    <button
                        onClick={() => toggleGroup(item.name)}
                        className={clsx(
                            'w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                            isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                        )}
                    >
                        <div className="flex items-center">
                            {item.icon && (
                                <item.icon
                                    className={clsx(
                                        'w-5 h-5 mr-3',
                                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'
                                    )}
                                />
                            )}
                            {item.name}
                        </div>
                        <ChevronDownIcon
                            className={clsx(
                                'w-4 h-4 transition-transform duration-200',
                                isExpanded ? 'rotate-180' : ''
                            )}
                        />
                    </button>
                ) : (
                    <Link
                        to={item.href}
                        className={clsx(
                            'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                            isActive
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700',
                            depth > 0 ? 'ml-9' : ''
                        )}
                    >
                        {item.icon && (
                            <item.icon
                                className={clsx(
                                    'w-5 h-5 mr-3',
                                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'
                                )}
                            />
                        )}
                        {item.name}
                    </Link>
                )}

                {hasChildren && isExpanded && (
                    <div className="mt-1 space-y-1">
                        {item.children?.map(child => renderNavItem(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
            {/* Mobile sidebar backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-surface-900/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 transition-transform duration-300 ease-in-out lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-surface-200 dark:border-surface-700">
                    <Link to="/dashboard" className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">PS</span>
                        </div>
                        <div>
                            <span className="font-display font-semibold text-lg text-surface-900 dark:text-white">
                                IntelliHR
                            </span>
                            {tenant && (
                                <p className="text-xs text-surface-500 truncate max-w-[120px]">
                                    {tenant.name}
                                </p>
                            )}
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-surface-500 hover:text-surface-700"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
                    {filteredNavigation.map((group) => (
                        <div key={group.title} className="space-y-2">
                            <h3 className="px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => renderNavItem(item))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Quick punch button - hidden for superusers in public schema */}
                {!(user?.is_superuser && profile?.current_tenant?.is_public) && (
                    <div className="p-4 border-t border-surface-200 dark:border-surface-700">
                        <button
                            onClick={() => navigate('/attendance')}
                            className="w-full btn-primary py-2.5 flex items-center justify-center"
                        >
                            <ClockIcon className="w-5 h-5 mr-2" />
                            Quick Punch
                        </button>
                    </div>
                )}
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between h-full px-4 sm:px-6">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-surface-500 hover:text-surface-700"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>

                        {/* Search (placeholder) */}
                        <div className="hidden sm:block flex-1 max-w-md ml-4">
                            <input
                                type="search"
                                placeholder="Search..."
                                className="w-full px-4 py-2 text-sm bg-surface-100 dark:bg-surface-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Right side */}
                        <div className="flex items-center space-x-4">
                            {/* Branch Selector - shows for multi-branch users */}
                            <BranchSelector />

                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                            >
                                {darkMode ? (
                                    <SunIcon className="w-5 h-5" />
                                ) : (
                                    <MoonIcon className="w-5 h-5" />
                                )}
                            </button>

                            {/* Chat */}
                            <Link
                                to="/chat"
                                className="relative p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                                title="Messages"
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                {totalUnreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-surface-800">
                                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                    </span>
                                )}
                            </Link>

                            {/* Notifications */}
                            <Link
                                to="/notifications"
                                className="relative p-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                                title="Notifications"
                            >
                                <BellIcon className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </Link>

                            {/* Profile dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
                                >
                                    <img
                                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=6366f1&color=fff`}
                                        alt="Profile"
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-surface-900 dark:text-white">
                                            {user?.full_name}
                                        </p>
                                        <p className="text-xs text-surface-500">
                                            {user?.is_superuser ? (
                                                <span className="text-amber-600 font-semibold">Superuser</span>
                                            ) : (
                                                <span>{user?.roles?.[0] || 'Employee'}</span>
                                            )}
                                        </p>
                                    </div>
                                    <ChevronDownIcon className="w-4 h-4 text-surface-400" />
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 py-1"
                                        >
                                            {/* User Info */}
                                            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                                                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">User Info</p>
                                                <p className="text-sm font-medium text-surface-900 dark:text-white mt-1">{user?.full_name}</p>
                                                <p className="text-xs text-surface-600 dark:text-surface-400">{user?.email}</p>
                                            </div>

                                            {/* Role/Permissions Info */}
                                            {user?.is_superuser && (
                                                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                                        ⭐ Superuser - All Permissions
                                                    </span>
                                                </div>
                                            )}

                                            {!user?.is_superuser && (
                                                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                                                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Roles</p>
                                                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                                                        View roles in settings/permissions
                                                    </p>
                                                </div>
                                            )}

                                            {/* Tenant Info */}
                                            {tenant && (
                                                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                                                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Tenant</p>
                                                    <p className="text-sm font-medium text-surface-900 dark:text-white mt-1">{tenant.name}</p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <Link
                                                to="/settings"
                                                className="block px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
                                                onClick={() => setProfileOpen(false)}
                                            >
                                                Profile Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center"
                                            >
                                                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                                                Sign out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
