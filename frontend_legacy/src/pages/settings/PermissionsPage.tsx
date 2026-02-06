import { useState } from 'react';
import { useUserProfile } from '@/hooks/useAccessControl';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { Shield, Key, Users, Lock } from 'lucide-react';

export default function PermissionsPage() {
  const { profile, loading } = useUserProfile();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'access'>('roles');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Permissions & Access
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          View your roles, permissions, and access levels in the system.
        </p>
      </div>

      {/* User Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{user?.full_name}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{user?.email}</p>
          </div>
          <div className="text-right">
            {user?.is_superuser ? (
              <div className="inline-flex items-center px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg text-sm font-semibold">
                <span className="text-lg mr-2">⭐</span>
                Superuser
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-semibold">
                <span className="text-lg mr-2">✓</span>
                Tenant User
              </div>
            )}
          </div>
        </div>

        {/* Tenant Info */}
        {profile?.current_tenant && !profile.current_tenant.is_public && (
          <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Current Tenant
            </p>
            <p className="font-mono text-sm text-slate-900 dark:text-white mt-1">
              {profile.current_tenant.schema}
            </p>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        {(['roles', 'permissions', 'access'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'roles' && <span>👥 Roles</span>}
            {tab === 'permissions' && <span>🔑 Permissions</span>}
            {tab === 'access' && <span>🔒 Access Control</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {user?.is_superuser ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                      Superuser Role
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                      You have unrestricted access to all features, modules, and settings in the system.
                      You can create tenants, manage all users, and configure system-wide settings.
                    </p>
                  </div>
                </div>
              </div>
            ) : profile?.roles && profile.roles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.roles.map((role: any) => (
                  <motion.div
                    key={role.code}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300">{role.name}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">{role.description}</p>
                    <code className="text-xs bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded inline-block mt-3">
                      {role.code}
                    </code>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No roles assigned. Contact your administrator.
              </div>
            )}
          </motion.div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {user?.is_superuser ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <p className="font-medium text-amber-900 dark:text-amber-300">
                  ✓ All Permissions Granted
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                  As a superuser, you have access to all permissions in the system.
                </p>
              </div>
            ) : profile?.permissions && profile.permissions.length > 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((permission: string) => (
                    <motion.span
                      key={permission}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                    >
                      {permission}
                    </motion.span>
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                  Total: {profile.permissions.length} permission(s)
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No permissions granted. Contact your administrator.
              </div>
            )}
          </motion.div>
        )}

        {/* Access Control Tab */}
        {activeTab === 'access' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Access Level */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Access Level</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Authentication</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">✓ Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Multi-Factor Auth</span>
                  <span className={user?.is_2fa_enabled ? 'text-green-600 dark:text-green-400 font-medium' : 'text-slate-500'}>
                    {user?.is_2fa_enabled ? '✓ Enabled' : '○ Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Account Status</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    ✓ Active
                  </span>
                </div>
              </div>
            </div>

            {/* Tenant Access */}
            {profile?.current_tenant && !profile.current_tenant.is_public && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Tenant Access</h3>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Current Tenant Schema</p>
                  <code className="block bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded font-mono text-sm text-slate-900 dark:text-white">
                    {profile.current_tenant.schema}
                  </code>
                </div>
              </div>
            )}

            {/* Module Access Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-300">Module Access</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {user?.is_superuser
                  ? 'You have access to all modules and features. Navigate using the sidebar menu.'
                  : 'Your module access is determined by your assigned roles and permissions. Only permitted modules appear in your navigation menu.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
          Need Help?
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          If you need access to additional features or modules, contact your tenant administrator or HR team.
          Superusers can manage roles and permissions in the admin panel.
        </p>
      </div>
    </div>
  );
}
