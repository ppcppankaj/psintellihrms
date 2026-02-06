/**
 * EmployeeTable Component - Data table for employee list
 */

import { Link } from 'react-router-dom'
import { Employee } from '@/services/employeeService'
import Avatar from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'

interface EmployeeTableProps {
    employees: Employee[]
    isLoading?: boolean
    onDelete?: (id: string) => void
}

export default function EmployeeTable({ employees, isLoading, onDelete }: EmployeeTableProps) {
    const hasPermission = useAuthStore((state) => state.hasPermission)

    const canEdit = hasPermission('employees.edit')
    const canDelete = hasPermission('employees.delete')

    if (isLoading) {
        return <TableSkeleton />
    }

    // Safety check for undefined/null employees
    if (!employees || employees.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-surface-900 dark:text-white">No employees</h3>
                <p className="mt-1 text-sm text-surface-500">Get started by adding a new employee.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                <thead className="bg-surface-50 dark:bg-surface-800/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                            Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                            Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                            Designation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                            Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-surface-800 divide-y divide-surface-200 dark:divide-surface-700">
                    {employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Link to={`/employees/${employee.id}`} className="flex items-center group">
                                    <Avatar
                                        name={employee.user?.full_name || employee.employee_id}
                                        src={employee.user?.avatar}
                                        size="md"
                                    />
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                            {employee.user?.full_name || employee.employee_id}
                                        </div>
                                        <div className="text-sm text-surface-500">
                                            {employee.employee_id} · {employee.user?.email || '—'}
                                        </div>
                                    </div>
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-surface-900 dark:text-white">
                                    {employee.department?.name || '—'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-surface-900 dark:text-white">
                                    {employee.designation?.name || '—'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={employee.employment_status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                                {new Date(employee.date_of_joining).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <Link
                                        to={`/employees/${employee.id}`}
                                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                    >
                                        View
                                    </Link>
                                    {canEdit && (
                                        <Link
                                            to={`/employees/${employee.id}/edit`}
                                            className="text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-300"
                                        >
                                            Edit
                                        </Link>
                                    )}
                                    {canDelete && onDelete && (
                                        <button
                                            onClick={() => onDelete(employee.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// Skeleton loader
function TableSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-10 bg-surface-100 dark:bg-surface-700 rounded mb-4" />
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-surface-50 dark:bg-surface-800 rounded mb-2" />
            ))}
        </div>
    )
}
