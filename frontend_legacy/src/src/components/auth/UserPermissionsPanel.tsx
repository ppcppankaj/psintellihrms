import { useUserProfile } from '@/hooks/useAccessControl';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

export function UserPermissionsPanel() {
  const { profile, loading } = useUserProfile();
  const user = useAuthStore((state) => state.user);

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500">
        Loading permissions...
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-6"
    >
      {/* User Info */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Access Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
            <p className="font-medium text-slate-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
            <p className="font-medium">
              {user?.is_superuser ? (
                <span className="text-amber-600 font-semibold">⭐ Superuser</span>
              ) : (
                <span className="text-green-600">Tenant User</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tenant Info */}
      {profile.current_tenant && !profile.current_tenant.is_public && (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Current Tenant Schema</p>
          <p className="font-mono bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded text-slate-900 dark:text-white">
            {profile.current_tenant.schema}
          </p>
        </div>
      )}

      {/* Roles */}
      {profile.roles && profile.roles.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Assigned Roles
          </h4>
          <div className="space-y-2">
            {profile.roles.map((role: any) => (
              <div
                key={role.code}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
              >
                <p className="font-medium text-blue-900 dark:text-blue-300">{role.name}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{role.description}</p>
                <code className="text-xs bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded mt-2 inline-block">
                  {role.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions */}
      {profile.permissions && profile.permissions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Permissions ({profile.permissions.length})
          </h4>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {profile.permissions.map((permission: string) => (
                <span
                  key={permission}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Superuser All Permissions */}
      {user?.is_superuser && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="font-medium text-amber-900 dark:text-amber-300">
            ⭐ Superuser Access
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            You have unrestricted access to all features and permissions in the system.
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default UserPermissionsPanel;
