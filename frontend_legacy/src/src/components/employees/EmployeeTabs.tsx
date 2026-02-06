import { useState, useEffect } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { useEmployeeStore } from '@/store/employeeStore'
import { useAuthStore } from '@/store/authStore'
import { EmployeeDetail } from '@/services/employeeService'

// Tab content components
import OverviewTab from './tabs/OverviewTab'
import DocumentsTab from './tabs/DocumentsTab'
import SkillsTab from './tabs/SkillsTab'
import SalaryTab from './tabs/SalaryTab'
import TimelineTab from './tabs/TimelineTab'
import AddressTab from './tabs/AddressTab'
import BankTab from './tabs/BankTab'
import FamilyTab from './tabs/FamilyTab'
import EmergencyContactTab from './tabs/EmergencyContactTab'
import { Users, Phone, MapPin, Building, FileText, Activity, Clock, Briefcase } from 'lucide-react'

interface EmployeeTabsProps {
    employee: EmployeeDetail
}

export default function EmployeeTabs({ employee }: EmployeeTabsProps) {
    const [activeTab, setActiveTab] = useState('overview')
    const hasPermission = useAuthStore((state) => state.hasPermission)
    const { fetchDocuments, fetchSkills, fetchTimeline } = useEmployeeStore()

    const canViewSalary = hasPermission('employees.view_salary')
    const canViewSensitive = hasPermission('employees.view_sensitive')

    // Define tabs
    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-4 h-4" /> },
        { id: 'family', label: 'Family', icon: <Users className="w-4 h-4" /> },
        { id: 'emergency', label: 'Emergency', icon: <Phone className="w-4 h-4" /> },
        ...(canViewSensitive ? [{ id: 'bank', label: 'Bank Info', icon: <Building className="w-4 h-4" /> }] : []),
        { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
        { id: 'skills', label: 'Skills', icon: <Activity className="w-4 h-4" /> },
        ...(canViewSalary ? [{ id: 'salary', label: 'Salary', icon: <Building className="w-4 h-4" /> }] : []),
        { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    ]

    // Load tab data on tab change
    useEffect(() => {
        if (activeTab === 'documents') {
            fetchDocuments(employee.id)
        } else if (activeTab === 'skills') {
            fetchSkills(employee.id)
        } else if (activeTab === 'timeline') {
            fetchTimeline(employee.id)
        }
    }, [activeTab, employee.id, fetchDocuments, fetchSkills, fetchTimeline])

    return (
        <Tabs tabs={tabs} defaultTab="overview" onChange={setActiveTab}>
            {activeTab === 'overview' && <OverviewTab employee={employee} />}
            {activeTab === 'addresses' && <AddressTab employeeId={employee.id} />}
            {activeTab === 'family' && <FamilyTab employeeId={employee.id} />}
            {activeTab === 'emergency' && <EmergencyContactTab employeeId={employee.id} />}
            {activeTab === 'bank' && canViewSensitive && <BankTab employeeId={employee.id} />}
            {activeTab === 'documents' && <DocumentsTab employeeId={employee.id} />}
            {activeTab === 'skills' && <SkillsTab employeeId={employee.id} />}
            {activeTab === 'salary' && canViewSalary && <SalaryTab employeeId={employee.id} />}
            {activeTab === 'timeline' && <TimelineTab employeeId={employee.id} />}
        </Tabs>
    )
}
