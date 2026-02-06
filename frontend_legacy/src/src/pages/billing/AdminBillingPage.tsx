/**
 * Admin Billing Page - Manage Invoices & Bank Details
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { billingService, BankDetails } from '@/services/billingService'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'
import { PlusIcon, PencilIcon, CreditCardIcon, RectangleStackIcon } from '@heroicons/react/24/outline'

export default function AdminBillingPage() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Billing Administration</h1>
                <div className="flex space-x-3">
                    <Link
                        to="/admin/plans"
                        className="flex items-center px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700"
                    >
                        <RectangleStackIcon className="w-5 h-5 mr-2" />
                        Manage Plans
                    </Link>
                    <Link
                        to="/admin/subscriptions"
                        className="flex items-center px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700"
                    >
                        <CreditCardIcon className="w-5 h-5 mr-2" />
                        Manage Subscriptions
                    </Link>
                </div>
            </div>

            <InvoicesSection />
            <BankDetailsSection />
        </div>
    )
}

function InvoicesSection() {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form, setForm] = useState({
        subscription: '',
        invoice_number: '',
        amount: '',
        tax: '',
        billing_period_start: '',
        billing_period_end: '',
        due_date: '',
        status: 'pending' as const
    })

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['admin-invoices'],
        queryFn: billingService.getInvoices
    })

    const { data: subscriptions } = useQuery({
        queryKey: ['admin-subscriptions'],
        queryFn: billingService.getSubscriptions
    })

    const createMutation = useMutation({
        mutationFn: billingService.createInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
            setIsModalOpen(false)
            toast.success('Invoice created successfully')
            setForm({
                subscription: '',
                invoice_number: '',
                amount: '',
                tax: '',
                billing_period_start: '',
                billing_period_end: '',
                due_date: '',
                status: 'pending'
            })
        },
        onError: () => {
            toast.error('Failed to create invoice')
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseFloat(form.amount)
        const tax = parseFloat(form.tax || '0')
        createMutation.mutate({
            subscription: form.subscription,
            invoice_number: form.invoice_number,
            amount,
            tax,
            total: amount + tax,
            billing_period_start: form.billing_period_start,
            billing_period_end: form.billing_period_end,
            due_date: form.due_date,
            status: form.status
        })
    }

    if (isLoading) return <LoadingSpinner />

    // Safely handle if invoices is not an array
    const invoiceList = Array.isArray(invoices) ? invoices : []
    const subscriptionList = Array.isArray(subscriptions) ? subscriptions : []

    return (
        <Card>
            <CardHeader
                title="Invoices"
                action={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Invoice
                    </button>
                }
            />
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                        <thead>
                            <tr>
                                <th className="text-left text-xs font-medium text-surface-500 uppercase py-3">Invoice #</th>
                                <th className="text-left text-xs font-medium text-surface-500 uppercase py-3">Tenant/Sub</th>
                                <th className="text-left text-xs font-medium text-surface-500 uppercase py-3">Amount</th>
                                <th className="text-left text-xs font-medium text-surface-500 uppercase py-3">Status</th>
                                <th className="text-left text-xs font-medium text-surface-500 uppercase py-3">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                            {invoiceList.length > 0 ? (
                                invoiceList.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td className="py-3 text-sm font-medium">{invoice.invoice_number}</td>
                                        <td className="py-3 text-sm text-surface-500">{invoice.subscription}</td>
                                        <td className="py-3 text-sm">₹{invoice.total}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full uppercase ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                                }`}>{invoice.status}</span>
                                        </td>
                                        <td className="py-3 text-sm">{invoice.due_date}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-surface-500">No invoices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Invoice">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Tenant Subscription</label>
                        <select
                            value={form.subscription}
                            onChange={e => setForm({ ...form, subscription: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        >
                            <option value="">Select Subscription</option>
                            {subscriptionList.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.tenant} - {sub.plan_details?.name || sub.plan} ({sub.billing_cycle})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Invoice Number</label>
                            <input
                                type="text"
                                value={form.invoice_number}
                                onChange={e => setForm({ ...form, invoice_number: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="INV-2024-001"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value as any })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="1000.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Tax (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.tax}
                                onChange={e => setForm({ ...form, tax: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="180.00"
                            />
                        </div>
                    </div>

                    {form.amount && (
                        <div className="text-right text-sm text-surface-600">
                            Total: ₹{(parseFloat(form.amount) + parseFloat(form.tax || '0')).toFixed(2)}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Billing Period Start</label>
                            <input
                                type="date"
                                value={form.billing_period_start}
                                onChange={e => setForm({ ...form, billing_period_start: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Billing Period End</label>
                            <input
                                type="date"
                                value={form.billing_period_end}
                                onChange={e => setForm({ ...form, billing_period_end: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Due Date</label>
                        <input
                            type="date"
                            value={form.due_date}
                            onChange={e => setForm({ ...form, due_date: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-surface-300 rounded-lg hover:bg-surface-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </Modal>
        </Card>
    )
}

function BankDetailsSection() {
    const queryClient = useQueryClient()
    const [isEditing, setIsEditing] = useState(false)
    const [bankId, setBankId] = useState<string | null>(null)
    const [form, setForm] = useState({
        bank_name: '',
        account_name: '',
        account_number: '',
        ifsc_code: '',
        swift_code: '',
        branch_name: ''
    })

    const { data: bankDetails, isLoading } = useQuery({
        queryKey: ['admin-bank-details'],
        queryFn: billingService.getBankDetails
    })

    const createMutation = useMutation({
        mutationFn: billingService.createBankDetails,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-bank-details'] })
            setIsEditing(false)
            toast.success('Bank details saved')
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: any) => billingService.updateBankDetails(bankId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-bank-details'] })
            setIsEditing(false)
            toast.success('Bank details updated')
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (bankId) {
            updateMutation.mutate(form)
        } else {
            createMutation.mutate(form)
        }
    }

    const handleEdit = (details: BankDetails) => {
        setBankId(details.id)
        setForm({
            bank_name: details.bank_name,
            account_name: details.account_name,
            account_number: details.account_number,
            ifsc_code: details.ifsc_code,
            swift_code: details.swift_code || '',
            branch_name: details.branch_name || ''
        })
        setIsEditing(true)
    }

    const handleAddNew = () => {
        setBankId(null)
        setForm({
            bank_name: '', account_name: '', account_number: '',
            ifsc_code: '', swift_code: '', branch_name: ''
        })
        setIsEditing(true)
    }

    if (isLoading) return <LoadingSpinner />

    // Safely handle non-array data
    const banks = Array.isArray(bankDetails) ? bankDetails : []

    return (
        <Card>
            <CardHeader
                title="Bank Account Configuration"
                action={
                    !banks.length && !isEditing ? (
                        <button
                            onClick={handleAddNew}
                            className="text-sm text-primary-600 hover:underline"
                        >
                            + Add Bank Account
                        </button>
                    ) : null
                }
            />
            <CardContent>
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Bank Name"
                                value={form.bank_name}
                                onChange={e => setForm({ ...form, bank_name: e.target.value })}
                                className="input" required
                            />
                            <input
                                placeholder="Account Name"
                                value={form.account_name}
                                onChange={e => setForm({ ...form, account_name: e.target.value })}
                                className="input" required
                            />
                            <input
                                placeholder="Account Number"
                                value={form.account_number}
                                onChange={e => setForm({ ...form, account_number: e.target.value })}
                                className="input" required
                            />
                            <input
                                placeholder="IFSC Code"
                                value={form.ifsc_code}
                                onChange={e => setForm({ ...form, ifsc_code: e.target.value })}
                                className="input" required
                            />
                            <input
                                placeholder="Branch Name"
                                value={form.branch_name}
                                onChange={e => setForm({ ...form, branch_name: e.target.value })}
                                className="input"
                            />
                            <input
                                placeholder="SWIFT Code"
                                value={form.swift_code}
                                onChange={e => setForm({ ...form, swift_code: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded">Cancel</button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        {banks.map(bank => (
                            <div key={bank.id} className="flex justify-between items-center p-4 border rounded-lg bg-surface-50 dark:bg-surface-800">
                                <div>
                                    <p className="font-bold">{bank.bank_name}</p>
                                    <p className="text-sm">{bank.account_name} - {bank.account_number}</p>
                                    <p className="text-xs text-surface-500">IFSC: {bank.ifsc_code}</p>
                                </div>
                                <button onClick={() => handleEdit(bank)} className="p-2 text-surface-500 hover:text-primary-600">
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
