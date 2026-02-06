/**
 * EmployeeCreatePage - Create new employee
 */

import { Link } from 'react-router-dom'
import EmployeeForm from '@/components/employees/EmployeeForm'

export default function EmployeeCreatePage() {
    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-surface-500">
                <Link to="/employees" className="hover:text-primary-600">Employees</Link>
                <span>/</span>
                <span className="text-surface-900 dark:text-white">New Employee</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                    Add New Employee
                </h1>
                <p className="text-surface-500 mt-1">
                    Create a new employee record in the system
                </p>
            </div>

            {/* Form */}
            <EmployeeForm mode="create" />
        </div>
    )
}
