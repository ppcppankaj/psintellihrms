import React, { useEffect, useState } from 'react';
import { coreService } from '../../api/coreService';
import type { Organization } from '../../api/coreService';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Building, Activity, Globe } from 'lucide-react';

const SuperAdminDashboard: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const response = await coreService.getOrganizations();
                // 🛡️ Robust data extraction
                if (Array.isArray(response)) {
                    setOrganizations(response);
                } else if (response && 'data' in response && Array.isArray(response.data)) {
                    setOrganizations(response.data);
                } else if (response && 'results' in response && Array.isArray((response as any).results)) {
                    setOrganizations((response as any).results);
                } else {
                    console.warn('Unexpected organizations response format:', response);
                    setOrganizations([]);
                }
            } catch (error) {
                console.error('Failed to fetch organizations', error);
                setOrganizations([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrgs();
    }, []);

    const columns: Column<Organization>[] = [
        { header: 'Organization Name', accessor: 'name', className: 'font-semibold text-slate-900' },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Status',
            accessor: (org) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${org.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {org.subscription_status}
                </span>
            )
        },
        { header: 'Currency', accessor: 'currency' },
        { header: 'Timezone', accessor: 'timezone' },
    ];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Global System Dashboard</h1>
                <p className="text-slate-500 mt-1">Manage all organizations and system-level configurations.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Organizations</h3>
                        <Building className="text-primary-600" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{organizations.length}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Active Subscriptions</h3>
                        <Activity className="text-green-600" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-slate-900">
                        {organizations.filter(o => o.subscription_status === 'active').length}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Global Reach</h3>
                        <Globe className="text-blue-600" size={24} />
                    </div>
                    <p className="text-4xl font-bold text-slate-900">
                        {new Set(organizations.map(o => o.timezone)).size}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Unique Timezones</p>
                </div>
            </div>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Managed Organizations</h2>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold">
                        Register New Org
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={organizations.map(org => ({ ...org, id: org.id }))}
                    isLoading={isLoading}
                />
            </section>
        </div>
    );
};

export default SuperAdminDashboard;
