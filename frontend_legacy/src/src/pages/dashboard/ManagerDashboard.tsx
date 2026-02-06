/**
 * Manager Dashboard - Approval and Team Overview
 */

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { leaveService } from '@/services/leaveService'
import { expenseService } from '@/services/expenseService'
import { transitionsService } from '@/services/transitionsService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ApprovalItem {
    id: string
    type: 'leave' | 'expense' | 'transfer' | 'promotion' | 'resignation'
    title: string
    subtitle: string
    amount?: string
    date: string
    status: string
    employeeName: string
    employeeId: string
}

export default function ManagerDashboard() {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState<'all' | 'leave' | 'expense' | 'transitions'>('all')

    // Fetch pending leave approvals
    const { data: pendingLeaves, isLoading: loadingLeaves } = useQuery({
        queryKey: ['pending-leave-approvals'],
        queryFn: () => leaveService.getPendingApprovals(),
        enabled: !!user?.employee_id,
    })

    // Fetch pending expense approvals
    const { data: pendingExpenses, isLoading: loadingExpenses } = useQuery({
        queryKey: ['pending-expense-approvals'],
        queryFn: () => expenseService.getPendingApprovals(),
        enabled: !!user?.employee_id,
    })

    // Fetch pending transfers
    const { data: pendingTransfers, isLoading: loadingTransfers } = useQuery({
        queryKey: ['pending-transfers'],
        queryFn: () => transitionsService.getTransfers({ status: 'pending' }),
        enabled: !!user?.employee_id,
    })

    // Leave approval mutation
    const leaveApprovalMutation = useMutation({
        mutationFn: ({ id, action, comments }: { id: string; action: 'approve' | 'reject'; comments?: string }) => {
            if (action === 'approve') {
                return leaveService.approve(id, comments)
            } else {
                return leaveService.reject(id, comments)
            }
        },
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ['pending-leave-approvals'] })
            toast.success(action === 'approve' ? 'Leave approved' : 'Leave rejected')
        },
        onError: () => toast.error('Action failed'),
    })

    // Expense approval mutation
    const expenseApprovalMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
            expenseService.approveClaim(id, { action }),
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ['pending-expense-approvals'] })
            toast.success(action === 'approve' ? 'Expense approved' : 'Expense rejected')
        },
        onError: () => toast.error('Action failed'),
    })

    // Transfer approval mutation
    const transferApprovalMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
            transitionsService.approveTransfer(id, { action }),
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ['pending-transfers'] })
            toast.success(action === 'approve' ? 'Transfer approved' : 'Transfer rejected')
        },
        onError: () => toast.error('Action failed'),
    })

    const handleApproval = (item: ApprovalItem, action: 'approve' | 'reject') => {
        switch (item.type) {
            case 'leave':
                leaveApprovalMutation.mutate({ id: item.id, action })
                break
            case 'expense':
                expenseApprovalMutation.mutate({ id: item.id, action })
                break
            case 'transfer':
            case 'promotion':
                transferApprovalMutation.mutate({ id: item.id, action })
                break
        }
    }

    const isLoading = loadingLeaves || loadingExpenses || loadingTransfers

    // Transform data to unified format
    const allItems: ApprovalItem[] = [
        ...(pendingLeaves?.map((l: any) => ({
            id: l.id,
            type: 'leave' as const,
            title: `${l.leave_type_name} Request`,
            subtitle: `${l.start_date} - ${l.end_date}`,
            date: l.created_at,
            status: l.status,
            employeeName: l.employee_name,
            employeeId: l.employee_id,
        })) || []),
        ...(pendingExpenses?.map((e: any) => ({
            id: e.id,
            type: 'expense' as const,
            title: e.title,
            subtitle: e.description || 'Expense claim',
            amount: `₹${e.total_amount?.toLocaleString()}`,
            date: e.claim_date,
            status: e.status,
            employeeName: e.employee_name,
            employeeId: e.employee_id,
        })) || []),
        ...(pendingTransfers?.map((t: any) => ({
            id: t.id,
            type: 'transfer' as const,
            title: `${t.transfer_type_display} Request`,
            subtitle: `${t.from_department_name} → ${t.to_department_name}`,
            date: t.effective_date,
            status: t.status,
            employeeName: t.employee_name,
            employeeId: t.employee_id,
        })) || []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const filteredItems = activeTab === 'all'
        ? allItems
        : allItems.filter(item => {
            if (activeTab === 'transitions') return ['transfer', 'promotion', 'resignation'].includes(item.type)
            return item.type === activeTab
        })

    const stats = {
        total: allItems.length,
        leaves: pendingLeaves?.length || 0,
        expenses: pendingExpenses?.length || 0,
        transitions: pendingTransfers?.length || 0,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                    Manager Dashboard
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                    Review and action pending approvals
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    icon={ClockIcon}
                    label="Total Pending"
                    value={stats.total}
                    color="bg-gradient-to-br from-primary-500 to-primary-700"
                />
                <StatsCard
                    icon={CalendarDaysIcon}
                    label="Leave Requests"
                    value={stats.leaves}
                    color="bg-gradient-to-br from-blue-500 to-blue-700"
                />
                <StatsCard
                    icon={CurrencyDollarIcon}
                    label="Expense Claims"
                    value={stats.expenses}
                    color="bg-gradient-to-br from-green-500 to-green-700"
                />
                <StatsCard
                    icon={UserGroupIcon}
                    label="Transitions"
                    value={stats.transitions}
                    color="bg-gradient-to-br from-purple-500 to-purple-700"
                />
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg w-fit">
                {[
                    { id: 'all', label: `All (${stats.total})` },
                    { id: 'leave', label: `Leave (${stats.leaves})` },
                    { id: 'expense', label: `Expense (${stats.expenses})` },
                    { id: 'transitions', label: `Transitions (${stats.transitions})` },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow'
                            : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Approval List */}
            <div className="card">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <LoadingSpinner />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-medium text-surface-900 dark:text-white">All Caught Up!</h3>
                        <p className="text-surface-500 mt-1">No pending approvals in this category</p>
                    </div>
                ) : (
                    <div className="divide-y divide-surface-200 dark:divide-surface-700">
                        {filteredItems.map((item) => (
                            <ApprovalRow
                                key={`${item.type}-${item.id}`}
                                item={item}
                                onApprove={() => handleApproval(item, 'approve')}
                                onReject={() => handleApproval(item, 'reject')}
                                isLoading={
                                    leaveApprovalMutation.isPending ||
                                    expenseApprovalMutation.isPending ||
                                    transferApprovalMutation.isPending
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatsCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType
    label: string
    value: number
    color: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${color} rounded-xl p-4 text-white`}
        >
            <Icon className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-80">{label}</p>
        </motion.div>
    )
}

function ApprovalRow({
    item,
    onApprove,
    onReject,
    isLoading,
}: {
    item: ApprovalItem
    onApprove: () => void
    onReject: () => void
    isLoading: boolean
}) {
    const typeColors: Record<string, string> = {
        leave: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        expense: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        promotion: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        resignation: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }

    return (
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${typeColors[item.type]}`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <span className="text-sm text-surface-500">
                        {new Date(item.date).toLocaleDateString()}
                    </span>
                </div>
                <h4 className="font-medium text-surface-900 dark:text-white">{item.title}</h4>
                <p className="text-sm text-surface-500">{item.subtitle}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                    <span className="font-medium">{item.employeeName}</span> · {item.employeeId}
                </p>
            </div>
            {item.amount && (
                <div className="text-right">
                    <p className="text-lg font-bold text-surface-900 dark:text-white">{item.amount}</p>
                </div>
            )}
            <div className="flex gap-2">
                <button
                    onClick={onApprove}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Approve
                </button>
                <button
                    onClick={onReject}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    Reject
                </button>
            </div>
        </div>
    )
}
