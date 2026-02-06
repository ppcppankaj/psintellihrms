
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Users, Heart } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { employeeService, EmployeeDependent } from '../../../services/employeeService'

interface FamilyTabProps {
    employeeId: string
}

const FamilyTab: React.FC<FamilyTabProps> = ({ employeeId }) => {
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<Partial<EmployeeDependent>>({
        name: '',
        relationship: 'spouse',
        date_of_birth: '',
        gender: '',
        is_covered_in_insurance: false,
        is_disabled: false
    })

    const { data: dependents, isLoading } = useQuery({
        queryKey: ['employee-dependents', employeeId],
        queryFn: () => employeeService.getDependents(employeeId)
    })

    const createMutation = useMutation({
        mutationFn: (data: Partial<EmployeeDependent>) =>
            employeeService.createDependent({ ...data, employee: employeeId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-dependents'] })
            setIsAdding(false)
            resetForm()
            toast.success('Dependent added')
        },
        onError: () => toast.error('Failed to add dependent')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeDependent> }) =>
            employeeService.updateDependent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-dependents'] })
            setIsEditing(null)
            resetForm()
            toast.success('Dependent updated')
        },
        onError: () => toast.error('Failed to update dependent')
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => employeeService.deleteDependent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-dependents'] })
            toast.success('Dependent deleted')
        }
    })

    const resetForm = () => {
        setFormData({
            name: '',
            relationship: 'spouse',
            date_of_birth: '',
            gender: '',
            is_covered_in_insurance: false,
            is_disabled: false
        })
    }

    const handleEdit = (dep: EmployeeDependent) => {
        if (!dep.id) return
        setIsEditing(dep.id)
        setFormData(dep)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEditing) {
            updateMutation.mutate({ id: isEditing, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading family details...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900">Family & Dependents</h3>
                {!isAdding && !isEditing && (
                    <button
                        onClick={() => { setIsAdding(true); resetForm() }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Member
                    </button>
                )}
            </div>

            {(isAdding || isEditing) && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
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
                                <select
                                    value={formData.relationship}
                                    onChange={e => setFormData(prev => ({ ...prev, relationship: e.target.value as any }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="spouse">Spouse</option>
                                    <option value="child">Child</option>
                                    <option value="parent">Parent</option>
                                    <option value="sibling">Sibling</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={formData.date_of_birth || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="insurance"
                                    checked={formData.is_covered_in_insurance}
                                    onChange={e => setFormData(prev => ({ ...prev, is_covered_in_insurance: e.target.checked }))}
                                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <label htmlFor="insurance" className="text-sm text-slate-700">Covered in Insurance</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="disabled"
                                    checked={formData.is_disabled}
                                    onChange={e => setFormData(prev => ({ ...prev, is_disabled: e.target.checked }))}
                                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <label htmlFor="disabled" className="text-sm text-slate-700">Person with Disability</label>
                            </div>
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
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Add Member')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {dependents?.length === 0 && !isAdding && (
                    <div className="md:col-span-2 p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                        No family members added.
                    </div>
                )}

                {dependents?.map((dep) => (
                    <div
                        key={dep.id}
                        className="group relative p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-all"
                    >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(dep)} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteMutation.mutate(dep.id!)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-pink-50 text-pink-600 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900 flex items-center gap-2 capitalize">
                                    {dep.name}
                                    {dep.is_covered_in_insurance && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
                                            <Heart className="w-3 h-3 fill-current" /> Insured
                                        </span>
                                    )}
                                </h4>
                                <div className="mt-2 text-sm text-slate-600 space-y-1">
                                    <p className="capitalize font-medium text-slate-700">{dep.relationship}</p>
                                    <p>DOB: {dep.date_of_birth || 'N/A'} • {dep.gender || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FamilyTab
