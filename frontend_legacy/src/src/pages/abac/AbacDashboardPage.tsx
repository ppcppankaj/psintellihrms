/**
 * ABAC Dashboard - Main page for attribute-based access control
 */

import { useEffect, useState } from 'react'
import { useAbacStore } from '@/store/abacStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
    ShieldCheckIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    UserGroupIcon,
    PlusIcon,
} from '@heroicons/react/24/outline'

interface TabConfig {
    id: string
    label: string
    icon: React.ComponentType<any>
    description: string
}

const tabs: TabConfig[] = [
    {
        id: 'attributes',
        label: 'Attributes',
        icon: Cog6ToothIcon,
        description: 'Manage attribute types and values',
    },
    {
        id: 'policies',
        label: 'Policies',
        icon: DocumentTextIcon,
        description: 'Create and manage access policies',
    },
    {
        id: 'user-policies',
        label: 'User Policies',
        icon: UserGroupIcon,
        description: 'Assign policies to users',
    },
]

export default function AbacDashboardPage() {
    const { attributeTypes, policies, isLoadingAttributeTypes, isLoadingPolicies, fetchAttributeTypes, fetchPolicies } =
        useAbacStore()
    const [activeTab, setActiveTab] = useState('attributes')

    // Ensure we always work with an array to avoid runtime errors on filter/map
    const policyList = Array.isArray(policies) ? policies : []

    useEffect(() => {
        fetchAttributeTypes()
        fetchPolicies()
    }, [fetchAttributeTypes, fetchPolicies])

    const isLoading = isLoadingAttributeTypes || isLoadingPolicies

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                            Access Control (ABAC)
                        </h1>
                    </div>
                    <p className="text-surface-500 mt-2">
                        Manage attribute-based access control policies and rules
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-surface-600 dark:text-surface-400 text-sm font-medium">
                                Attributes
                            </p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-2">
                                {attributeTypes.length}
                            </p>
                        </div>
                        <Cog6ToothIcon className="w-10 h-10 text-primary-100 dark:text-primary-900" />
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-surface-600 dark:text-surface-400 text-sm font-medium">
                                Policies
                            </p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-2">
                                {policyList.length}
                            </p>
                        </div>
                        <DocumentTextIcon className="w-10 h-10 text-blue-100 dark:text-blue-900" />
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-surface-600 dark:text-surface-400 text-sm font-medium">
                                Active Policies
                            </p>
                            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-2">
                                {policyList.filter((p) => p.is_active).length}
                            </p>
                        </div>
                        <ShieldCheckIcon className="w-10 h-10 text-green-100 dark:text-green-900" />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm">
                <div className="flex border-b border-surface-200 dark:border-surface-700">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-300'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center min-h-[300px]">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div>
                            {activeTab === 'attributes' && <AttributeTypesSection />}
                            {activeTab === 'policies' && <PoliciesSection />}
                            {activeTab === 'user-policies' && <UserPoliciesSection />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function AttributeTypesSection() {
    const { attributeTypes } = useAbacStore()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-surface-600 dark:text-surface-400">
                    {attributeTypes.length} attribute types defined
                </p>
                {/* TODO: Add create attribute button */}
            </div>

            {attributeTypes.length === 0 ? (
                <div className="text-center py-8">
                    <Cog6ToothIcon className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                    <p className="text-surface-600 dark:text-surface-400">No attributes defined yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {attributeTypes.map((attr) => (
                        <div
                            key={attr.id}
                            className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">
                                        {attr.name}
                                    </p>
                                    <p className="text-sm text-surface-600 dark:text-surface-400">
                                        {attr.code} • {attr.category}
                                    </p>
                                    <p className="text-sm text-surface-500 mt-1">{attr.description}</p>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        attr.is_active
                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                    }`}
                                >
                                    {attr.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function PoliciesSection() {
    const { policies } = useAbacStore()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-surface-600 dark:text-surface-400">
                    {policies.length} policies configured
                </p>
                {/* TODO: Add create policy button */}
            </div>

            {policies.length === 0 ? (
                <div className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                    <p className="text-surface-600 dark:text-surface-400">No policies defined yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {policies.map((policy) => (
                        <div
                            key={policy.id}
                            className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-surface-900 dark:text-white">
                                            {policy.name}
                                        </p>
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                policy.effect === 'ALLOW'
                                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                            }`}
                                        >
                                            {policy.effect}
                                        </span>
                                    </div>
                                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                        {policy.code} • Priority: {policy.priority}
                                    </p>
                                    <p className="text-sm text-surface-500 mt-1">{policy.description}</p>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        policy.is_active
                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                    }`}
                                >
                                    {policy.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function UserPoliciesSection() {
    return (
        <div className="space-y-4">
            <p className="text-surface-600 dark:text-surface-400">
                Manage policies assigned to users
            </p>
            <div className="text-center py-8">
                <UserGroupIcon className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                <p className="text-surface-600 dark:text-surface-400">User policies management coming soon</p>
            </div>
        </div>
    )
}
