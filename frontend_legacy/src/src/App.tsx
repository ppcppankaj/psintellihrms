// App config
import { Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardRedirect from '@/components/auth/DashboardRedirect'
import { ErrorBoundary as GlobalErrorBoundary } from '@/components/ErrorBoundary'
import { ChatProvider } from '@/context/ChatContext'
import { routes } from '@/routes'
import { OrganizationProvider } from '@/context/TenantProvider'
import AppBootstrap from '@/components/AppBootstrap'

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout'

// Auth route wrapper (redirect if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore()
    const location = useLocation()

    if (isAuthenticated) {
        return <DashboardRedirect />
    }

    return <>{children}</>
}

// Full-page loading component
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-surface-500">Loading...</p>
            </div>
        </div>
    )
}

export default function App() {
    const { isAuthenticated } = useAuthStore()

    return (
        <GlobalErrorBoundary>
            <OrganizationProvider>
                <AppBootstrap>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* Auth routes */}
                            {routes.auth.map((route) => (
                                <Route
                                    key={route.path}
                                    path={route.path}
                                    element={
                                        <AuthRoute>
                                            <route.element />
                                        </AuthRoute>
                                    }
                                />
                            ))}

                            {/* Public routes (2FA etc) */}
                            {routes.public.map((route) => (
                                <Route
                                    key={route.path}
                                    path={route.path}
                                    element={<route.element />}
                                />
                            ))}

                            {/* Protected routes with layout */}
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <ChatProvider>
                                            <ErrorBoundary>
                                                <DashboardLayout />
                                            </ErrorBoundary>
                                        </ChatProvider>
                                    </ProtectedRoute>
                                }
                            >
                                {routes.dashboard.map((route) => {
                                    const Element = route.element
                                    const elementWithGuards = route.requireSuperuser ? (
                                        <ProtectedRoute requireSuperuser>
                                            <Element />
                                        </ProtectedRoute>
                                    ) : (route as any).requireTenantAdmin ? (
                                        <ProtectedRoute requireTenantAdmin>
                                            <Element />
                                        </ProtectedRoute>
                                    ) : route.permission ? (
                                        <ProtectedRoute permission={route.permission}>
                                            <Element />
                                        </ProtectedRoute>
                                    ) : (
                                        <Element />
                                    )

                                    return (
                                        <Route key={route.path} path={route.path} element={elementWithGuards} />
                                    )
                                })}

                                {/* Redirects/Cleanups for legacy paths */}
                                <Route path="/payroll" element={<Navigate to="/payroll/payslips" replace />} />
                                <Route path="/recruitment" element={<Navigate to="/recruitment/jobs" replace />} />
                            </Route>

                            {/* Root Redirects */}
                            <Route
                                path="/"
                                element={
                                    isAuthenticated ? (
                                        <DashboardRedirect />
                                    ) : (
                                        <Navigate to="/login" replace />
                                    )
                                }
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </AppBootstrap>
            </OrganizationProvider>
        </GlobalErrorBoundary>
    )
}
