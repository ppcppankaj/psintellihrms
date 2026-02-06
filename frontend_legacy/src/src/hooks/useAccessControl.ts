import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';

interface UserProfile {
  user: any;
  is_superuser: boolean;
  is_tenant_admin: boolean;
  roles: any[];
  permissions: string[];
  current_tenant: {
    schema: string;
    is_public: boolean;
  };
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/auth/profile/');
        setProfile(response.data.data);
      } catch (err: any) {
        const status = err?.response?.status;
        const code = err?.response?.data?.error?.code || err?.response?.data?.error?.details?.code;

        // Superusers hitting tenant schemas may not exist there; fall back to public profile
        if (status === 401 && code === 'user_not_found' && user?.is_superuser) {
          setProfile({
            user,
            is_superuser: true,
            is_tenant_admin: false,
            roles: user.roles || [],
            permissions: user.permissions || [],
            current_tenant: { schema: 'public', is_public: true },
          });
          setError(null);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  return { profile, loading, error };
}

export function useSuperuserOnly() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // Must be superuser
        if (!user?.is_superuser) {
          navigate('/dashboard');
          return;
        }
        // Superuser-only pages are restricted to public schema
        const response = await api.get('/auth/profile/');
        const profile = response.data?.data;
        if (!profile?.current_tenant?.is_public) {
          // In tenant schema: redirect to dashboard
          navigate('/dashboard');
          return;
        }
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      verifyAccess();
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  return { isLoading: loading };
}

export function useOrganizationContextAdmin() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Tenant admins are superusers in tenant schema
        if (!user?.is_superuser) {
          navigate('/dashboard');
          return;
        }

        // Fetch profile to check if in tenant schema
        const response = await api.get('/auth/profile/');
        const profileData = response.data.data;
        setProfile(profileData);

        // Redirect superusers to public schema
        if (profileData.current_tenant.is_public) {
          navigate('/admin/tenants');
        }
      } catch (err) {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAccess();
    }
  }, [user, navigate]);

  return { loading, profile };
}

export function useRoleBasedAccess(requiredRoles: string[]) {
  const [hasAccess, setHasAccess] = useState(false);
  const { profile, loading } = useUserProfile();

  useEffect(() => {
    if (!loading && profile) {
      const userRoles = profile.roles.map((r) => r.code);
      const access = requiredRoles.some((role) => userRoles.includes(role));
      setHasAccess(access || profile.is_superuser);
    }
  }, [profile, loading, requiredRoles]);

  return hasAccess;
}
