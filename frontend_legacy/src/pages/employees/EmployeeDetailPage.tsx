/**
 * EmployeeDetailPage - Employee detail with tabbed view
 */

import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEmployeeStore } from '@/store/employeeStore'
import { useAuthStore } from '@/store/authStore'
import EmployeeTabs from '@/components/employees/EmployeeTabs'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function EmployeeDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const {
        currentEmployee,
        isLoadingDetail,
        detailError,
        fetchEmployee,
        clearCurrentEmployee,
        deleteEmployee
    } = useEmployeeStore()

    const hasPermission = useAuthStore((state) => state.hasPermission)
    const canEdit = hasPermission('employees.edit')
    const canDelete = hasPermission('employees.delete')

    useEffect(() => {
        if (id) {
            fetchEmployee(id)
        }
        return () => clearCurrentEmployee()
    }, [id, fetchEmployee, clearCurrentEmployee])

    const handleDelete = async () => {
        if (!id) return
        if (window.confirm('Are you sure you want to delete this employee?')) {
            await deleteEmployee(id)
            navigate('/employees')
        }
    }

    if (isLoadingDetail) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (detailError || !currentEmployee) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
                    Employee not found
                </h2>
                <p className="text-surface-500 mt-2">{detailError || 'The requested employee could not be found.'}</p>
                <Link
                    to="/employees"
                    className="inline-block mt-4 text-primary-600 hover:text-primary-700"
                >
                    ← Back to Employees
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-surface-500">
                <Link to="/employees" className="hover:text-primary-600">Employees</Link>
                <span>/</span>
                <span className="text-surface-900 dark:text-white">{currentEmployee.user.full_name}</span>
            </nav>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        {currentEmployee.user.full_name}
                    </h1>
                    <p className="text-surface-500 mt-1">
                        {currentEmployee.designation?.name || 'No designation'} · {currentEmployee.department?.name || 'No department'}
                    </p>
                </div>
                <div className="flex gap-3">
                    {canEdit && (
                        <Link
                            to={`/employees/${id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                        >
                            <EditIcon />
                            Edit
                        </Link>
                    )}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600/50 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <DeleteIcon />
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <EmployeeTabs employee={currentEmployee} />
        </div>
    )
}

function EditIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    )
}

function DeleteIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
}
