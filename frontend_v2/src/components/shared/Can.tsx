import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface CanProps {
    permission?: string;
    role?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, role, children, fallback = null }) => {
    const { user } = useSelector((state: RootState) => state.auth);

    if (!user) return <>{fallback}</>;

    // Superusers bypass all checks
    if (user.is_superuser) return <>{children}</>;

    const hasRole = role ? user.roles.includes(role) : true;
    const hasPermission = permission ? user.permissions.includes(permission) : true;

    if (hasRole && hasPermission) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
