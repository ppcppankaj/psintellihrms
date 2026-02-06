/**
 * AdminLeaveBalancesPage - View all employee balances
 */

import { useState } from 'react'
import EnterpriseTable, { Column, PaginatedData, TableState } from '@/components/ui/EnterpriseTable'
import { api } from '@/services/api'

export default function AdminLeaveBalancesPage() {
    const [refreshKey, setRefreshKey] = useState(0)

    const columns: Column<any>[] = [ // Relaxing type to any for EnterpriseTable compatibility
        {
            key: 'employee',
            header: 'Employee',
            render: (_: unknown, row: any) => {
                return row.employee_name || row.employee || row.employee_code || '-'
            }
        },
        {
            key: 'leave_type_name',
            header: 'Leave Type',
            render: (_: unknown, row: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.leave_type_name} ({row.leave_type_code})
                </div>
            )
        },
        { key: 'year', header: 'Year', width: '80px' },
        { key: 'opening_balance', header: 'Opening', width: '100px' },
        { key: 'accrued', header: 'Accrued', width: '100px' },
        { key: 'taken', header: 'Taken', width: '100px' },
        {
            key: 'available',
            header: 'Available',
            width: '100px',
            render: (val: unknown) => <span className="font-bold text-primary-600">{(val as number).toFixed(1)}</span>
        },
    ]

    const fetchData = async (state: TableState): Promise<PaginatedData<Record<string, unknown>>> => {
        const response = await api.get('/leave/balances/', {
            params: {
                page: state.page,
                page_size: state.pageSize,
                search: state.search,
                ordering: state.sortOrder === 'desc' ? `-${state.sortBy}` : state.sortBy,
                ...state.filters,
            }
        })
        return response.data as PaginatedData<Record<string, unknown>>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Leave Balances (All Employees)
                    </h1>
                    <p className="text-surface-500 mt-1">
                        View leave balances across the organization
                    </p>
                </div>
                <button
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="btn-secondary"
                >
                    Refresh
                </button>
            </div>

            <EnterpriseTable
                key={refreshKey}
                columns={columns}
                fetchData={fetchData}
                rowKey="id"
                searchPlaceholder="Search by employee..."
            />
        </div>
    )
}
