/**
 * Policies Management Page
 */

import { useEffect, useState } from 'react'
import { useAbacStore } from '@/store/abacStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function PoliciesPage() {
    const { policies, isLoadingPolicies, fetchPolicies, createPolicy, updatePolicy, deletePolicy } =
        useAbacStore()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [selectedPolicy, setSelectedPolicy] = useState<any>(null)
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        effect: 'ALLOW' as const,
        priority: 1,
        condition: 'AND' as const,
    })

    useEffect(() => {
        fetchPolicies()
    }, [fetchPolicies])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const data = {
            code: formData.code,
            name: formData.name,
            description: formData.description,
            effect: formData.effect,
            priority: formData.priority,
            condition: formData.condition,
        }

        try {
            if (editingId) {
                await updatePolicy(editingId, data)
                setEditingId(null)
            } else {
                await createPolicy(data)
            }
            resetForm()
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            effect: 'ALLOW',
            priority: 1,
            condition: 'AND',
        })
        setShowForm(false)
    }

    const handleEdit = (policy: any) => {
        setEditingId(policy.id)
        setFormData({
            code: policy.code,
            name: policy.name,
            description: policy.description,
            effect: policy.effect,
            priority: policy.priority,
            condition: policy.condition,
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Delete policy "${name}"?`)) {
            await deletePolicy(id)
        }
    }

    if (isLoadingPolicies) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Form & List */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Access Policies
                    </h1>
                    <button
                        onClick={() => {
                            resetForm()
                            setShowForm(!showForm)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Policy
                    </button>
                </div>

                {showForm && (
                    <form
                        onSubmit={handleSubmit}
                        className="p-6 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700"
                    >
                        <h3 className="text-lg font-semibold mb-4">
                            {editingId ? 'Edit Policy' : 'Create New Policy'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., EMPLOYEE_READ"
                                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Employee Read Access"
                                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Effect *
                                </label>
                                <select
                                    value={formData.effect}
                                    onChange={(e) => setFormData({ ...formData, effect: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                                >
                                    <option value="ALLOW">Allow</option>
                                    <option value="DENY">Deny</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Priority
                                </label>
                                <input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                    min="1"
                                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Condition
                                </label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                                >
                                    <option value="AND">AND (all must match)</option>
                                    <option value="OR">OR (any can match)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe this policy..."
                                rows={3}
                                className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                            />
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                <CheckIcon className="w-5 h-5" />
                                Save Policy
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex items-center gap-2 px-4 py-2 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-300"
                            >
                                <XMarkIcon className="w-5 h-5" />
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {policies.length === 0 ? (
                    <div className="text-center py-12 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                        <p className="text-surface-600 dark:text-surface-400">No policies found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {policies.map((policy) => (
                            <div
                                key={policy.id}
                                className="p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setSelectedPolicy(policy)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-surface-900 dark:text-white">
                                                {policy.name}
                                            </p>
                                            <span
                                                className={`px-2 py-1 text-xs font-bold rounded ${
                                                    policy.effect === 'ALLOW'
                                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                }`}
                                            >
                                                {policy.effect}
                                            </span>
                                        </div>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                            {policy.code} • Priority: {policy.priority} • Rules: {policy.rules?.length || 0}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedPolicy(policy)
                                            }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                        >
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit(policy)
                                            }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(policy.id, policy.name)
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Policy Detail */}
            {selectedPolicy && (
                <div className="lg:col-span-1">
                    <div className="sticky top-6 p-6 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold mb-4">{selectedPolicy.name}</h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-surface-600 dark:text-surface-400">Code</p>
                                <p className="font-medium">{selectedPolicy.code}</p>
                            </div>

                            <div>
                                <p className="text-sm text-surface-600 dark:text-surface-400">Effect</p>
                                <p className="font-medium capitalize">{selectedPolicy.effect}</p>
                            </div>

                            <div>
                                <p className="text-sm text-surface-600 dark:text-surface-400">Priority</p>
                                <p className="font-medium">{selectedPolicy.priority}</p>
                            </div>

                            <div>
                                <p className="text-sm text-surface-600 dark:text-surface-400">Condition</p>
                                <p className="font-medium">{selectedPolicy.condition}</p>
                            </div>

                            <div>
                                <p className="text-sm text-surface-600 dark:text-surface-400">Rules</p>
                                <p className="font-medium">{selectedPolicy.rules?.length || 0} rule(s)</p>
                            </div>

                            {selectedPolicy.description && (
                                <div>
                                    <p className="text-sm text-surface-600 dark:text-surface-400">Description</p>
                                    <p className="text-sm">{selectedPolicy.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
