/**
 * Attribute Types Management Page
 */

import { useEffect, useState } from 'react'
import { useAbacStore } from '@/store/abacStore'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function AttributeTypesPage() {
    const { attributeTypes, isLoadingAttributeTypes, fetchAttributeTypes, createAttributeType, updateAttributeType, deleteAttributeType } = useAbacStore()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: 'subject' as const,
        description: '',
        values: '',
    })

    useEffect(() => {
        fetchAttributeTypes()
    }, [fetchAttributeTypes])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const valuesArray = formData.values
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v.length > 0)

        const data = {
            code: formData.code,
            name: formData.name,
            category: formData.category,
            description: formData.description,
            values: valuesArray,
        }

        try {
            if (editingId) {
                await updateAttributeType(editingId, data)
                setEditingId(null)
            } else {
                await createAttributeType(data)
            }
            setFormData({ code: '', name: '', category: 'subject', description: '', values: '' })
            setShowForm(false)
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleEdit = (attr: any) => {
        setEditingId(attr.id)
        setFormData({
            code: attr.code,
            name: attr.name,
            category: attr.category,
            description: attr.description,
            values: attr.values?.join(', ') || '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Delete attribute "${name}"?`)) {
            await deleteAttributeType(id)
        }
    }

    if (isLoadingAttributeTypes) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Attribute Types
                </h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm)
                        setEditingId(null)
                        setFormData({ code: '', name: '', category: 'subject', description: '', values: '' })
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Attribute
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Code *
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g., department"
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
                                placeholder="e.g., Department"
                                className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                            >
                                <option value="subject">Subject</option>
                                <option value="resource">Resource</option>
                                <option value="action">Action</option>
                                <option value="environment">Environment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Values (comma-separated)
                            </label>
                            <input
                                type="text"
                                value={formData.values}
                                onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                                placeholder="e.g., Sales, Marketing, IT"
                                className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe this attribute type..."
                                rows={3}
                                className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            <CheckIcon className="w-5 h-5" />
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false)
                                setEditingId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-300 dark:hover:bg-surface-600"
                        >
                            <XMarkIcon className="w-5 h-5" />
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {attributeTypes.length === 0 ? (
                <div className="text-center py-12 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                    <p className="text-surface-600 dark:text-surface-400">No attribute types found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {attributeTypes.map((attr) => (
                        <div
                            key={attr.id}
                            className="p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-surface-900 dark:text-white">
                                        {attr.name}
                                    </p>
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                                        {attr.category}
                                    </span>
                                </div>
                                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                    Code: {attr.code}
                                </p>
                                {attr.values && attr.values.length > 0 && (
                                    <div className="flex gap-1 mt-2">
                                        {attr.values.slice(0, 3).map((v, i) => (
                                            <span key={i} className="px-2 py-1 text-xs bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded">
                                                {v}
                                            </span>
                                        ))}
                                        {attr.values.length > 3 && (
                                            <span className="px-2 py-1 text-xs text-surface-600 dark:text-surface-400">
                                                +{attr.values.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(attr)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(attr.id, attr.name)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
