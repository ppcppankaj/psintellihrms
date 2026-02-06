
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { employeeService, EmployeeAddress } from '../../../services/employeeService'

interface AddressTabProps {
    employeeId: string
}

const AddressTab: React.FC<AddressTabProps> = ({ employeeId }) => {
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const queryClient = useQueryClient()

    // Form state
    const [formData, setFormData] = useState<Partial<EmployeeAddress>>({
        address_type: 'current',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        country: 'India',
        postal_code: '',
        is_primary: false
    })

    // Queries
    const { data: addresses, isLoading } = useQuery({
        queryKey: ['employee-addresses', employeeId],
        queryFn: () => employeeService.getAddresses(employeeId)
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Partial<EmployeeAddress>) =>
            employeeService.createAddress({ ...data, employee: employeeId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-addresses'] })
            setIsAdding(false)
            resetForm()
            toast.success('Address added')
        },
        onError: () => toast.error('Failed to add address')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeAddress> }) =>
            employeeService.updateAddress(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-addresses'] })
            setIsEditing(null)
            resetForm()
            toast.success('Address updated')
        },
        onError: () => toast.error('Failed to update address')
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => employeeService.deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-addresses'] })
            toast.success('Address deleted')
        }
    })

    const resetForm = () => {
        setFormData({
            address_type: 'current',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            country: 'India',
            postal_code: '',
            is_primary: false
        })
    }

    const handleEdit = (addr: EmployeeAddress) => {
        if (!addr.id) return
        setIsEditing(addr.id)
        setFormData(addr)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEditing) {
            updateMutation.mutate({ id: isEditing, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading addresses...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900">Address Book</h3>
                {!isAdding && !isEditing && (
                    <button
                        onClick={() => { setIsAdding(true); resetForm() }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Address
                    </button>
                )}
            </div>

            {(isAdding || isEditing) && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select
                                    value={formData.address_type}
                                    onChange={e => setFormData(prev => ({ ...prev, address_type: e.target.value as any }))}
                                    className="w-full md:w-1/3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="current">Current</option>
                                    <option value="permanent">Permanent</option>
                                    <option value="temporary">Temporary</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address_line1}
                                    onChange={e => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.address_line2}
                                    onChange={e => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.city}
                                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.state}
                                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.postal_code}
                                    onChange={e => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.country}
                                    onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <input
                                type="checkbox"
                                id="addr_primary"
                                checked={formData.is_primary}
                                onChange={e => setFormData(prev => ({ ...prev, is_primary: e.target.checked }))}
                                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <label htmlFor="addr_primary" className="text-sm text-slate-700">Set as Primary Address</label>
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
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isEditing ? 'Update Address' : 'Add Address')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {addresses?.length === 0 && !isAdding && (
                    <div className="md:col-span-2 p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                        No addresses found.
                    </div>
                )}

                {addresses?.map((addr) => (
                    <div
                        key={addr.id}
                        className="group relative p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-all"
                    >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(addr)} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteMutation.mutate(addr.id!)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900 flex items-center gap-2 capitalize">
                                    {addr.address_type} Address
                                    {addr.is_primary && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Primary</span>
                                    )}
                                </h4>
                                <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                                    <p>{addr.address_line1}</p>
                                    {addr.address_line2 && <p>{addr.address_line2}</p>}
                                    <p>{addr.city}, {addr.state} - {addr.postal_code}</p>
                                    <p>{addr.country}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AddressTab
