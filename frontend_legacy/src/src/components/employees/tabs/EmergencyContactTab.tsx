
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { employeeService, EmergencyContact } from '../../../services/employeeService'

interface EmergencyTabProps {
    employeeId: string
}

const EmergencyContactTab: React.FC<EmergencyTabProps> = ({ employeeId }) => {
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<Partial<EmergencyContact>>({
        name: '',
        relationship: '',
        phone: '',
        alternate_phone: '',
        email: '',
        address: '',
        is_primary: false
    })

    // Queries
    const { data: contacts, isLoading } = useQuery({
        queryKey: ['employee-contacts', employeeId],
        queryFn: () => employeeService.getEmergencyContacts(employeeId)
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Partial<EmergencyContact>) =>
            employeeService.createEmergencyContact({ ...data, employee: employeeId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-contacts'] })
            setIsAdding(false)
            resetForm()
            toast.success('Contact added')
        },
        onError: () => toast.error('Failed to add contact')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<EmergencyContact> }) =>
            employeeService.updateEmergencyContact(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-contacts'] })
            setIsEditing(null)
            resetForm()
            toast.success('Contact updated')
        },
        onError: () => toast.error('Failed to update contact')
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => employeeService.deleteEmergencyContact(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-contacts'] })
            toast.success('Contact deleted')
        }
    })

    const resetForm = () => {
        setFormData({
            name: '',
            relationship: '',
            phone: '',
            alternate_phone: '',
            email: '',
            address: '',
            is_primary: false
        })
    }

    const handleEdit = (contact: EmergencyContact) => {
        if (!contact.id) return
        setIsEditing(contact.id)
        setFormData(contact)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEditing) {
            updateMutation.mutate({ id: isEditing, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading contacts...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900">Emergency Contacts</h3>
                {!isAdding && !isEditing && (
                    <button
                        onClick={() => { setIsAdding(true); resetForm() }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Contact
                    </button>
                )}
            </div>

            {(isAdding || isEditing) && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Spouse, Father"
                                    value={formData.relationship}
                                    onChange={e => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <input
                                type="checkbox"
                                id="is_primary"
                                checked={formData.is_primary}
                                onChange={e => setFormData(prev => ({ ...prev, is_primary: e.target.checked }))}
                                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <label htmlFor="is_primary" className="text-sm text-slate-700">Primary Contact</label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setIsEditing(null); resetForm() }}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Add Contact')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {contacts?.length === 0 && !isAdding && (
                    <div className="md:col-span-2 p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                        No emergency contacts added.
                    </div>
                )}

                {contacts?.map((contact) => (
                    <div
                        key={contact.id}
                        className="group relative p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-all border-l-4 border-l-orange-500"
                    >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(contact)} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteMutation.mutate(contact.id!)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                    {contact.name}
                                    {contact.is_primary && (
                                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">Primary</span>
                                    )}
                                </h4>
                                <div className="mt-2 text-sm text-slate-600 space-y-1">
                                    <p className="font-medium text-slate-700">{contact.relationship}</p>
                                    <p className="font-mono">{contact.phone}</p>
                                    {contact.email && <p className="text-slate-500">{contact.email}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default EmergencyContactTab
