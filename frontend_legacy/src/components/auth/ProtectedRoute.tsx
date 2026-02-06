import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUserProfile } from '@/hooks/useAccessControl';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  requireSuperuser?: boolean;
  requireTenantAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  permission,
  requireSuperuser = false,
  requireTenantAdmin = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, user, hasPermission, tenant } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    hasPermission: state.hasPermission,
    tenant: state.organization,
  }));

  console.log('[ProtectedRoute] Check', {
    isAuthenticated,
    user: user?.email,
    path: location.pathname,
    hasTenant: !!tenant
  });
  const { profile, loading } = useUserProfile();
  const isPublicSchema = profile?.current_tenant?.is_public === true;

  // Not authenticated
  if (!isAuthenticated || !user) {
    console.log('[ProtectedRoute] Redirecting to login (not auth)');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait for profile when schema-based guards are requested
  if ((requireSuperuser || requireTenantAdmin) && loading) {
    console.log('[ProtectedRoute] Waiting for profile loading...');
    return <LoadingSpinner />;
  }

  // Require superuser (public schema)
  if (requireSuperuser && (!user.is_superuser || !isPublicSchema)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Require tenant admin (tenant schema + superuser)
  if (requireTenantAdmin && (!user.is_superuser || isPublicSchema)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check specific permission
  if (permission && !hasPermission(permission)) {
    console.log('[ProtectedRoute] Permission denied', { required: permission, userPermissions: user.permissions });
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            You don't have permission to access this page.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
