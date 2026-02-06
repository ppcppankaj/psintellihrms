/**
 * Superadmin Dashboard - Overview of all tenants
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { useSuperuserOnly } from '@/hooks/useAccessControl';
import { api } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  inactive_tenants: number;
  by_status: {
    trial: number;
    active: number;
    past_due: number;
    cancelled: number;
    suspended: number;
  };
  by_country: Array<{ country: string; count: number }>;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  industry: string;
  company_size: string;
  subscription_status: string;
  is_active: boolean;
  created_at: string;
}

export default function SuperadminDashboard() {
  const { isLoading: isVerifying } = useSuperuserOnly();
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsResponse = await api.get('/tenants/statistics/');
      setStats(statsResponse.data.data);

      // Load recent tenants
      const tenantsResponse = await api.get('/tenants/');
      const tenants = tenantsResponse.data.data || [];
      setRecentTenants(tenants.slice(0, 5)); // Show 5 most recent
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statusColors = {
    trial: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    past_due: 'bg-orange-100 text-orange-800',
    cancelled: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
  };

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.total_tenants || 0,
      icon: BuildingOfficeIcon,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Tenants',
      value: stats?.active_tenants || 0,
      icon: CheckCircleIcon,
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Inactive Tenants',
      value: stats?.inactive_tenants || 0,
      icon: XCircleIcon,
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      title: 'Trial Users',
      value: stats?.by_status.trial || 0,
      icon: ClockIcon,
      color: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Superadmin Dashboard</h1>
              <p className="text-slate-600 mt-2">Overview of all tenants and system status</p>
            </div>
            <Link
              to="/admin/tenants"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition"
            >
              <BuildingOfficeIcon className="w-5 h-5" />
              Manage Tenants
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{card.value}</div>
                <div className="text-sm text-slate-600">{card.title}</div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${card.color}`} />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscription Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Subscription Status</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(stats?.by_status || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[status as keyof typeof statusColors]
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{
                          width: `${((count / (stats?.total_tenants || 1)) * 100).toFixed(0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-lg font-bold text-slate-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Countries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Tenants by Country</h2>
            </div>
            <div className="space-y-4">
              {(stats?.by_country || []).slice(0, 5).map((item, index) => (
                <div key={item.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-700">
                      {index + 1}
                    </div>
                    <span className="text-slate-900 font-medium">{item.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{
                          width: `${((item.count / (stats?.total_tenants || 1)) * 100).toFixed(0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-lg font-bold text-slate-900 w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Tenants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Recent Tenants</h2>
              </div>
              <Link
                to="/admin/tenants"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Industry</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-600">
                      No tenants found. Create your first tenant to get started.
                    </td>
                  </tr>
                ) : (
                  recentTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{tenant.name}</div>
                          <div className="text-sm text-slate-600">{tenant.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{tenant.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{tenant.industry || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{tenant.company_size || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[tenant.subscription_status as keyof typeof statusColors]
                          }`}
                        >
                          {tenant.subscription_status.charAt(0).toUpperCase() +
                            tenant.subscription_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Link
            to="/admin/tenants"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <PlusIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Create Tenant</div>
                <div className="text-sm text-slate-600">Add a new organization</div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/tenants"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Manage Tenants</div>
                <div className="text-sm text-slate-600">View and edit all tenants</div>
              </div>
            </div>
          </Link>

          <Link
            to="/settings"
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">System Settings</div>
                <div className="text-sm text-slate-600">Configure platform</div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
