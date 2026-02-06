/**
 * EmployeeEditPage - Edit existing employee
 */

import { Link, useParams } from 'react-router-dom'
import EmployeeForm from '@/components/employees/EmployeeForm'

export default function EmployeeEditPage() {
    const { id } = useParams<{ id: string }>()

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-surface-500">
                <Link to="/employees" className="hover:text-primary-600">Employees</Link>
                <span>/</span>
                <Link to={`/employees/${id}`} className="hover:text-primary-600">Employee</Link>
                <span>/</span>
                <span className="text-surface-900 dark:text-white">Edit</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Edit Employee
                </h1>
                <p className="text-surface-500 mt-1">
                    Update employee information
                </p>
            </div>

            {/* Form */}
            <EmployeeForm employeeId={id} mode="edit" />
        </div>
    )
}
