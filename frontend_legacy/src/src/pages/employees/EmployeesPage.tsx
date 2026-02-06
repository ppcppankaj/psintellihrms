/**
 * EmployeesPage - Employee list with filters and pagination
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEmployeeStore } from '@/store/employeeStore'
import { useAuthStore } from '@/store/authStore'
import EmployeeTable from '@/components/employees/EmployeeTable'
import Card, { CardContent } from '@/components/ui/Card'
import { api, apiUpload } from '@/services/api'
import BulkUploadModal from '@/components/ui/BulkUploadModal'
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export default function EmployeesPage() {
    const {
        employees,
        totalCount,
        currentPage,
        pageSize,
        isLoading,
        fetchEmployees,
        deleteEmployee,
        departments,
        fetchDropdowns
    } = useEmployeeStore()

    const hasPermission = useAuthStore((state) => state.hasPermission)
    const canCreate = hasPermission('employees.create')
    const canImport = hasPermission('employees.create') // Recycling create permission for now
    const canExport = hasPermission('employees.view')

    const [search, setSearch] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // Import/Export state
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)

    // Initial fetch
    useEffect(() => {
        fetchEmployees()
        fetchDropdowns()
    }, [fetchEmployees, fetchDropdowns])

    // Filter handler
    const handleFilter = () => {
        fetchEmployees({
            page: 1,
            search,
            department: departmentFilter,
            status: statusFilter,
        })
    }

    // Pagination
    const handlePageChange = (page: number) => {
        fetchEmployees({ page })
    }

    // Delete handler
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            await deleteEmployee(id)
        }
    }

    // Import handler
    const handleImport = async (file: File) => {
        const response = await apiUpload('/employees/import/', file) as any
        if (response.success_count && response.success_count > 0) {
            fetchEmployees() // Refresh list
        }
        return response
    }

    // Download helper
    const downloadFile = async (url: string, filename: string) => {
        try {
            const response = await api.get(url, { responseType: 'blob' })
            const href = URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = href
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(href)
        } catch (e) {
            console.error('Download failed', e)
            alert('Failed to download file.')
        }
    }

    const handleExport = () => downloadFile('/employees/export/?export_format=csv', 'employees_export.csv')
    const handleDownloadTemplate = () => downloadFile('/employees/template/', 'employee_import_template.csv')

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                        Employees
                    </h1>
                    <p className="text-surface-500 mt-1">
                        Manage your organization's workforce
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {canExport && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5" />
                            Export
                        </button>
                    )}
                    {canImport && (
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Import
                        </button>
                    )}
                    {canCreate && (
                        <Link
                            to="/employees/new"
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <PlusIcon />
                            Add Employee
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card padding="sm">
                <CardContent>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by name, email, or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
                        >
                            <option value="">All Departments</option>
                            {Array.isArray(departments) && departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="probation">Probation</option>
                            <option value="notice_period">Notice Period</option>
                            <option value="inactive">Inactive</option>
                            <option value="terminated">Terminated</option>
                        </select>
                        <button
                            onClick={handleFilter}
                            className="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                        >
                            Filter
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Employee Table */}
            <Card padding="none">
                <EmployeeTable
                    employees={employees}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-surface-500">
                                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} employees
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm rounded border border-surface-300 dark:border-surface-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 dark:hover:bg-surface-700"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm text-surface-600 dark:text-surface-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm rounded border border-surface-300 dark:border-surface-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 dark:hover:bg-surface-700"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <BulkUploadModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onUpload={handleImport}
                onDownloadTemplate={handleDownloadTemplate}
                title="Import Employees"
            />
        </div>
    )
}

function PlusIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    )
}
