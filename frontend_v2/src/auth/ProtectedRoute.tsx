import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user) {
        // Mapping internal app roles to backend roles
        const mappedAllowedRoles = allowedRoles.map(role => {
            if (role === 'SUPERADMIN') return 'superuser';
            if (role === 'ADMIN') return 'org_admin';
            if (role === 'EMPLOYEE') return 'employee';
            return role;
        });

        const isAuthorized = user.is_superuser || user.roles.some(role => mappedAllowedRoles.includes(role));

        if (!isAuthorized) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
