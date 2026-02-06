/**
 * Employee Service - API calls for employee management
 */

import { api } from './api'

// Types
export interface Employee {
    id: string
    employee_id: string
    user: {
        id: string
        email: string
        first_name: string
        last_name: string
        full_name: string
        avatar?: string
        phone?: string
    }
    full_name: string
    email: string
    department?: {
        id: string
        name: string
        code: string
    }
    designation?: {
        id: string
        name: string
        level: number
    }
    location?: {
        id: string
        name: string
        city: string
    }
    reporting_manager?: {
        id: string
        employee_id: string
        full_name: string
    }
    employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | 'consultant'
    employment_status: 'active' | 'probation' | 'notice_period' | 'inactive' | 'terminated'
    date_of_joining: string
    date_of_exit?: string
    created_at: string
    updated_at: string
    roles?: { id: string; name: string; code: string }[]
}

export interface EmployeeDetail extends Employee {
    date_of_birth?: string
    gender?: string
    marital_status?: string
    blood_group?: string
    nationality: string
    pan_number?: string
    aadhaar_number?: string
    uan_number?: string
    pf_number?: string
    esi_number?: string
    work_mode: 'office' | 'remote' | 'hybrid'
    notice_period_days: number
    bio?: string
    linkedin_url?: string
}

export interface EmployeeDocument {
    id: string
    document_type: string
    name: string
    file: string
    file_size: number
    is_verified: boolean
    expiry_date?: string
    created_at: string
}

export interface Skill {
    id: string
    name: string
    category: string
    description?: string
}

export interface EmployeeSkill {
    id: string
    skill: Skill
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    years_of_experience: number
    is_verified: boolean
}

export interface EmployeeTimeline {
    id: string
    change_type: string
    effective_date: string
    remarks?: string
    previous_department?: string
    new_department?: string
    previous_designation?: string
    new_designation?: string
    created_at: string
}

export interface EmployeeAddress {
    id?: string
    employee?: string
    address_type: 'permanent' | 'current' | 'temporary'
    address_line1: string
    address_line2?: string
    city: string
    state: string
    country: string
    postal_code: string
    is_primary: boolean
}

export interface EmployeeBankAccount {
    id?: string
    employee?: string
    account_holder_name: string
    bank_name: string
    branch_name: string
    account_number?: string // Write-only often
    masked_account_number?: string // Read-only
    ifsc_code: string
    account_type: 'savings' | 'current' | 'salary'
    is_primary: boolean
}

export interface EmergencyContact {
    id?: string
    employee?: string
    name: string
    relationship: string
    phone: string
    alternate_phone?: string
    email?: string
    address?: string
    is_primary: boolean
}

export interface EmployeeDependent {
    id?: string
    employee?: string
    name: string
    relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
    date_of_birth?: string
    gender?: string
    is_covered_in_insurance: boolean
    is_disabled: boolean
}

export interface EmployeeListParams {
    page?: number
    page_size?: number
    search?: string
    department?: string
    status?: string
    employment_type?: string
    ordering?: string
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export interface EmployeeFormData {
    employee_id: string
    email: string
    first_name: string
    last_name: string
    phone?: string
    department_id?: string
    designation_id?: string
    location_id?: string
    reporting_manager_id?: string
    employment_type: string
    employment_status: string
    date_of_joining: string
    date_of_birth?: string
    gender?: string
    work_mode?: string
}

class EmployeeService {
    private basePath = '/employees'

    // List employees with pagination and filters
    async getEmployees(params: EmployeeListParams = {}): Promise<PaginatedResponse<Employee>> {
        const response = await api.get<any>(this.basePath + '/', { params })
        const data = response.data

        // Handle wrapped response format: {success: true, data: [...]}
        if (data.success && data.data) {
            // Extract from custom wrapper
            const employees = Array.isArray(data.data) ? data.data : data.data.results || []
            return {
                count: data.data.count || employees.length,
                next: data.data.next || null,
                previous: data.data.previous || null,
                results: employees
            }
        }

        // Handle standard DRF pagination format
        if (data.results) {
            return data
        }

        // Handle plain array response
        if (Array.isArray(data)) {
            return {
                count: data.length,
                next: null,
                previous: null,
                results: data
            }
        }

        return { count: 0, next: null, previous: null, results: [] }
    }

    // Get single employee detail
    async getEmployee(id: string): Promise<EmployeeDetail> {
        const response = await api.get<EmployeeDetail>(`${this.basePath}/${id}/`)
        return response.data
    }

    // Create employee
    async createEmployee(data: EmployeeFormData): Promise<EmployeeDetail> {
        const response = await api.post<EmployeeDetail>(this.basePath + '/', data)
        return response.data
    }

    // Update employee
    async updateEmployee(id: string, data: Partial<EmployeeFormData>): Promise<EmployeeDetail> {
        const response = await api.patch<EmployeeDetail>(`${this.basePath}/${id}/`, data)
        return response.data
    }

    // Delete employee (soft delete)
    async deleteEmployee(id: string): Promise<void> {
        await api.delete(`${this.basePath}/${id}/`)
    }

    // Get employee documents
    async getDocuments(employeeId: string): Promise<EmployeeDocument[]> {
        try {
            const response = await api.get<any>(`${this.basePath}/${employeeId}/documents/`)
            const data = response.data
            if (Array.isArray(data)) return data
            if (data?.results) return data.results
            if (data?.data) return Array.isArray(data.data) ? data.data : []
            return []
        } catch {
            return [] // Endpoint may not exist yet
        }
    }

    // Upload document
    async uploadDocument(employeeId: string, file: File, documentType: string): Promise<EmployeeDocument | null> {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('document_type', documentType)
            formData.append('name', file.name)

            const response = await api.post<EmployeeDocument>(
                `${this.basePath}/${employeeId}/documents/`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )
            return response.data
        } catch {
            // Upload failed - endpoint may not exist yet
            return null
        }
    }

    // Get employee skills
    async getSkills(employeeId: string): Promise<EmployeeSkill[]> {
        try {
            const response = await api.get<any>(`${this.basePath}/${employeeId}/skills/`)
            const data = response.data
            if (Array.isArray(data)) return data
            if (data?.results) return data.results
            if (data?.data) return Array.isArray(data.data) ? data.data : []
            return []
        } catch {
            return [] // Endpoint may not exist yet
        }
    }

    // Get employment history
    async getTimeline(employeeId: string): Promise<EmployeeTimeline[]> {
        try {
            const response = await api.get<any>(`${this.basePath}/${employeeId}/history/`)
            const data = response.data
            if (Array.isArray(data)) return data
            if (data?.results) return data.results
            if (data?.data) return Array.isArray(data.data) ? data.data : []
            return []
        } catch {
            return [] // Endpoint may not exist yet
        }
    }

    // Helper to extract array from various response formats
    private extractArray(data: any): any[] {
        if (Array.isArray(data)) return data
        if (data?.data && Array.isArray(data.data)) return data.data
        if (data?.results && Array.isArray(data.results)) return data.results
        if (data?.data?.results && Array.isArray(data.data.results)) return data.data.results
        return []
    }

    // Get departments for dropdown
    async getDepartments(): Promise<{ id: string; name: string; code: string }[]> {
        try {
            const response = await api.get('/employees/departments/')
            return this.extractArray(response.data)
        } catch {
            return []
        }
    }

    // Get designations for dropdown
    async getDesignations(): Promise<{ id: string; name: string; level: number }[]> {
        try {
            const response = await api.get('/employees/designations/')
            return this.extractArray(response.data)
        } catch {
            return []
        }
    }

    // Get locations for dropdown
    async getLocations(): Promise<{ id: string; name: string; city: string }[]> {
        try {
            const response = await api.get('/employees/locations/')
            return this.extractArray(response.data)
        } catch {
            return []
        }
    }

    // Get available skills from master list
    async getAvailableSkills(): Promise<Skill[]> {
        try {
            const response = await api.get('/employees/skills/')
            return this.extractArray(response.data)
        } catch {
            return []
        }
    }

    // Add skill to employee
    async addEmployeeSkill(employeeId: string, skillData: { skill_id: string; proficiency: string; years_of_experience: number }): Promise<EmployeeSkill> {
        const response = await api.post<EmployeeSkill>(`${this.basePath}/${employeeId}/skills/`, skillData)
        return response.data
    }

    // Upload employee avatar
    async uploadEmployeeAvatar(employeeId: string, file: File): Promise<{ success: boolean; avatar_url: string }> {
        const formData = new FormData()
        formData.append('avatar', file)
        const response = await api.post<{ success: boolean; avatar_url: string }>(
            `${this.basePath}/${employeeId}/upload_avatar/`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        return response.data
    }
    // --- Addresses ---
    async getAddresses(employeeId: string): Promise<EmployeeAddress[]> {
        const response = await api.get<any>(`/employees/addresses/?employee=${employeeId}`)
        return this.extractArray(response.data)
    }

    async createAddress(data: Partial<EmployeeAddress>): Promise<EmployeeAddress> {
        const response = await api.post<EmployeeAddress>('/employees/addresses/', data)
        return response.data
    }

    async updateAddress(id: string, data: Partial<EmployeeAddress>): Promise<EmployeeAddress> {
        const response = await api.patch<EmployeeAddress>(`/employees/addresses/${id}/`, data)
        return response.data
    }

    async deleteAddress(id: string): Promise<void> {
        await api.delete(`/employees/addresses/${id}/`)
    }

    // --- Bank Accounts ---
    async getBankAccounts(employeeId: string): Promise<EmployeeBankAccount[]> {
        const response = await api.get<any>(`/employees/bank-accounts/?employee=${employeeId}`)
        return this.extractArray(response.data)
    }

    async createBankAccount(data: Partial<EmployeeBankAccount>): Promise<EmployeeBankAccount> {
        const response = await api.post<EmployeeBankAccount>('/employees/bank-accounts/', data)
        return response.data
    }

    async updateBankAccount(id: string, data: Partial<EmployeeBankAccount>): Promise<EmployeeBankAccount> {
        const response = await api.patch<EmployeeBankAccount>(`/employees/bank-accounts/${id}/`, data)
        return response.data
    }

    async deleteBankAccount(id: string): Promise<void> {
        await api.delete(`/employees/bank-accounts/${id}/`)
    }

    // --- Emergency Contacts ---
    async getEmergencyContacts(employeeId: string): Promise<EmergencyContact[]> {
        const response = await api.get<any>(`/employees/emergency-contacts/?employee=${employeeId}`)
        return this.extractArray(response.data)
    }

    async createEmergencyContact(data: Partial<EmergencyContact>): Promise<EmergencyContact> {
        const response = await api.post<EmergencyContact>('/employees/emergency-contacts/', data)
        return response.data
    }

    async updateEmergencyContact(id: string, data: Partial<EmergencyContact>): Promise<EmergencyContact> {
        const response = await api.patch<EmergencyContact>(`/employees/emergency-contacts/${id}/`, data)
        return response.data
    }

    async deleteEmergencyContact(id: string): Promise<void> {
        await api.delete(`/employees/emergency-contacts/${id}/`)
    }

    // --- Dependents ---
    async getDependents(employeeId: string): Promise<EmployeeDependent[]> {
        const response = await api.get<any>(`/employees/dependents/?employee=${employeeId}`)
        return this.extractArray(response.data)
    }

    async createDependent(data: Partial<EmployeeDependent>): Promise<EmployeeDependent> {
        const response = await api.post<EmployeeDependent>('/employees/dependents/', data)
        return response.data
    }

    async updateDependent(id: string, data: Partial<EmployeeDependent>): Promise<EmployeeDependent> {
        const response = await api.patch<EmployeeDependent>(`/employees/dependents/${id}/`, data)
        return response.data
    }

    async deleteDependent(id: string): Promise<void> {
        await api.delete(`/employees/dependents/${id}/`)
    }
}

export const employeeService = new EmployeeService()
