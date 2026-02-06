
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Shield, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { employeeService, EmployeeBankAccount } from '../../../services/employeeService'

interface BankTabProps {
    employeeId: string
}

const BankTab: React.FC<BankTabProps> = ({ employeeId }) => {
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const queryClient = useQueryClient()

    // New form state
    const [formData, setFormData] = useState<Partial<EmployeeBankAccount>>({
        bank_name: '',
        account_holder_name: '',
        branch_name: '',
        account_number: '', // Will be masked on read
        ifsc_code: '',
        account_type: 'savings',
        is_primary: false
    })

    const { data: accounts, isLoading } = useQuery({
        queryKey: ['employee-bank-accounts', employeeId],
        queryFn: () => employeeService.getBankAccounts(employeeId)
    })

    const createMutation = useMutation({
        mutationFn: (data: Partial<EmployeeBankAccount>) =>
            employeeService.createBankAccount({ ...data, employee: employeeId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-bank-accounts'] })
            setIsAdding(false)
            resetForm()
            toast.success('Bank account added')
        },
        onError: () => toast.error('Failed to add bank account')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeBankAccount> }) =>
            employeeService.updateBankAccount(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-bank-accounts'] })
            setIsEditing(null)
            resetForm()
            toast.success('Bank account updated')
        },
        onError: () => toast.error('Failed to update bank account')
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => employeeService.deleteBankAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-bank-accounts'] })
            toast.success('Bank account deleted')
        }
    })

    const resetForm = () => {
        setFormData({
            bank_name: '',
            account_holder_name: '',
            branch_name: '',
            account_number: '',
            ifsc_code: '',
            account_type: 'savings',
            is_primary: false
        })
    }

    const handleEdit = (account: EmployeeBankAccount) => {
        if (!account.id) return
        setIsEditing(account.id)
        setFormData({
            ...account,
            account_number: '' // Clear for security, user must re-enter to change
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEditing) {
            updateMutation.mutate({ id: isEditing, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading bank details...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900">Bank Accounts</h3>
                {!isAdding && !isEditing && (
                    <button
                        onClick={() => { setIsAdding(true); resetForm() }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Account
                    </button>
                )}
            </div>

            {(isAdding || isEditing) && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.bank_name}
                                    onChange={e => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Holder</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.account_holder_name}
                                    onChange={e => setFormData(prev => ({ ...prev, account_holder_name: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={isEditing ? "Leave blank to keep unchanged" : "Enter account number"}
                                        required={!isEditing}
                                        value={formData.account_number}
                                        onChange={e => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                                        className="w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.ifsc_code}
                                    onChange={e => setFormData(prev => ({ ...prev, ifsc_code: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.branch_name}
                                    onChange={e => setFormData(prev => ({ ...prev, branch_name: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select
                                    value={formData.account_type}
                                    onChange={e => setFormData(prev => ({ ...prev, account_type: e.target.value as any }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    <option value="savings">Savings</option>
                                    <option value="salary">Salary</option>
                                    <option value="current">Current</option>
                                </select>
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
                            <label htmlFor="is_primary" className="text-sm text-slate-700">Set as Primary Account</label>
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
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isEditing ? 'Update Account' : 'Add Account')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {accounts?.length === 0 && !isAdding && (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                        No bank accounts found. Add one to process salary.
                    </div>
                )}

                {accounts?.map((account) => (
                    <div
                        key={account.id}
                        className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                    {account.bank_name}
                                    {account.is_primary && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Primary</span>
                                    )}
                                </h4>
                                <div className="text-sm text-slate-500 mt-1 space-y-1">
                                    <p>A/C: <span className="font-mono text-slate-700">{account.masked_account_number}</span> • {account.account_type}</p>
                                    <p>IFSC: {account.ifsc_code} • Branch: {account.branch_name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(account)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this account?'))
                                        deleteMutation.mutate(account.id!)
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default BankTab
