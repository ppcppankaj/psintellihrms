/**
 * Billing Page - Tenant View
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { billingService } from '@/services/billingService'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { DocumentArrowDownIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline'

export default function BillingPage() {
    const [isPayModalOpen, setIsPayModalOpen] = useState(false)

    // Fetch Subscription
    const { data: subscription, isLoading: isLoadingSub } = useQuery({
        queryKey: ['my-subscription'],
        queryFn: billingService.getMySubscription
    })

    // Fetch Invoices
    const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ['my-invoices'],
        queryFn: billingService.getInvoices
    })

    // Fetch Bank Details (for modal)
    const { data: bankDetails } = useQuery({
        queryKey: ['bank-details'],
        queryFn: billingService.getBankDetails,
        enabled: isPayModalOpen
    })

    if (isLoadingSub || isLoadingInvoices) {
        return <LoadingSpinner />
    }

    const currentBank = bankDetails && bankDetails.length > 0 ? bankDetails[0] : null

    const getStatusBadge = (status: string) => {
        if (status === 'active') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Active</span>
        if (status === 'trial') return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">Trial</span>
        return null
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Billing & Subscription</h1>

            {/* Current Plan Card */}
            <Card>
                <CardHeader
                    title="Current Plan"
                    action={subscription ? getStatusBadge(subscription.status) : null}
                />
                <CardContent>
                    {subscription ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-primary-600 mb-1">{subscription.plan_details.name}</h3>
                                <p className="text-surface-500 mb-4">{subscription.plan_details.description}</p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-surface-500">Billing Cycle:</span>
                                        <span className="font-medium capitalize">{subscription.billing_cycle}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-surface-500">Next Billing Date:</span>
                                        <span className="font-medium">{new Date(subscription.next_billing_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-surface-500">Amount:</span>
                                        <span className="font-medium">₹{subscription.price}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Features Included:</h4>
                                <ul className="space-y-1 text-sm text-surface-600 dark:text-surface-300">
                                    {Object.entries(subscription.plan_details.features).map(([key, enabled]) => (
                                        enabled && (
                                            <li key={key} className="flex items-center">
                                                <span className="mr-2 text-green-500">✓</span>
                                                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                            </li>
                                        )
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p>No active subscription found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
                <CardHeader title="Invoices" />
                <CardContent>
                    {invoices && invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                                <thead>
                                    <tr>
                                        <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider py-3">Invoice #</th>
                                        <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider py-3">Date</th>
                                        <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider py-3">Amount</th>
                                        <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider py-3">Status</th>
                                        <th className="text-right text-xs font-medium text-surface-500 uppercase tracking-wider py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td className="py-3 text-sm font-medium">{invoice.invoice_number}</td>
                                            <td className="py-3 text-sm text-surface-500">{new Date(invoice.created_at).toLocaleDateString()}</td>
                                            <td className="py-3 text-sm">₹{invoice.total}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full uppercase font-bold
                                                    ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                        invoice.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    {invoice.status === 'pending' && (
                                                        <button
                                                            onClick={() => setIsPayModalOpen(true)}
                                                            className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition"
                                                        >
                                                            Pay Now
                                                        </button>
                                                    )}
                                                    {invoice.pdf_file && (
                                                        <a href={invoice.pdf_file} target="_blank" rel="noopener noreferrer" className="text-surface-500 hover:text-primary-600">
                                                            <DocumentArrowDownIcon className="w-5 h-5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-surface-500">
                            No invoices found.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Modal */}
            <Modal
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                title="Make Payment"
                size="md"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start">
                        <BuildingLibraryIcon className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Bank Transfer Details</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Please transfer the invoice amount to the following bank account and share the receipt with support.
                            </p>
                        </div>
                    </div>

                    {currentBank ? (
                        <div className="border border-surface-200 dark:border-surface-700 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <span className="text-surface-500">Bank Name:</span>
                                <span className="col-span-2 font-medium">{currentBank.bank_name}</span>

                                <span className="text-surface-500">Account Name:</span>
                                <span className="col-span-2 font-medium">{currentBank.account_name}</span>

                                <span className="text-surface-500">Account No:</span>
                                <span className="col-span-2 font-medium font-mono">{currentBank.account_number}</span>

                                <span className="text-surface-500">IFSC Code:</span>
                                <span className="col-span-2 font-medium font-mono">{currentBank.ifsc_code}</span>

                                {currentBank.swift_code && (
                                    <>
                                        <span className="text-surface-500">SWIFT Code:</span>
                                        <span className="col-span-2 font-medium font-mono">{currentBank.swift_code}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-surface-500">
                            Bank details not available. Please contact support.
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => setIsPayModalOpen(false)}
                            className="px-4 py-2 bg-surface-200 text-surface-800 rounded-lg hover:bg-surface-300 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
