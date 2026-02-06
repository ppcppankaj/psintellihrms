/**
 * Employee Store - Zustand state management for employees
 */

import { create } from 'zustand'
import {
    employeeService,
    Employee,
    EmployeeDetail,
    EmployeeListParams,
    EmployeeDocument,
    EmployeeSkill,
    EmployeeTimeline,
    Skill
} from '@/services/employeeService'

interface EmployeeState {
    // List state
    employees: Employee[]
    totalCount: number
    currentPage: number
    pageSize: number
    isLoading: boolean
    error: string | null

    // Detail state
    currentEmployee: EmployeeDetail | null
    isLoadingDetail: boolean
    detailError: string | null

    // Related data
    documents: EmployeeDocument[]
    skills: EmployeeSkill[]
    timeline: EmployeeTimeline[]
    isLoadingRelated: boolean

    // Dropdowns
    departments: { id: string; name: string; code: string }[]
    designations: { id: string; name: string; level: number }[]
    locations: { id: string; name: string; city: string }[]
    availableSkills: Skill[]

    // Actions
    fetchEmployees: (params?: EmployeeListParams) => Promise<void>
    fetchEmployee: (id: string) => Promise<void>
    createEmployee: (data: any) => Promise<EmployeeDetail>
    updateEmployee: (id: string, data: any) => Promise<EmployeeDetail>
    deleteEmployee: (id: string) => Promise<void>
    fetchDocuments: (employeeId: string) => Promise<void>
    fetchSkills: (employeeId: string) => Promise<void>
    addSkill: (employeeId: string, skillData: { skill_id: string; proficiency: string; years_of_experience: number }) => Promise<void>
    fetchTimeline: (employeeId: string) => Promise<void>
    fetchDropdowns: () => Promise<void>
    fetchAvailableSkills: () => Promise<void>
    uploadAvatar: (employeeId: string, file: File) => Promise<void>
    clearCurrentEmployee: () => void
    clearError: () => void
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
    // Initial state
    employees: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    isLoading: false,
    error: null,

    currentEmployee: null,
    isLoadingDetail: false,
    detailError: null,

    documents: [],
    skills: [],
    timeline: [],
    isLoadingRelated: false,

    departments: [],
    designations: [],
    locations: [],
    availableSkills: [],

    // Actions
    fetchEmployees: async (params = {}) => {
        set({ isLoading: true, error: null })
        try {
            const response = await employeeService.getEmployees({
                page: params.page || get().currentPage,
                page_size: params.page_size || get().pageSize,
                ...params,
            })
            set({
                employees: response.results,
                totalCount: response.count,
                currentPage: params.page || get().currentPage,
                isLoading: false,
            })
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Failed to fetch employees',
                isLoading: false
            })
        }
    },

    fetchEmployee: async (id: string) => {
        set({ isLoadingDetail: true, detailError: null })
        try {
            const employee = await employeeService.getEmployee(id)
            set({ currentEmployee: employee, isLoadingDetail: false })
        } catch (error: any) {
            set({
                detailError: error.response?.data?.message || 'Failed to fetch employee',
                isLoadingDetail: false
            })
        }
    },

    createEmployee: async (data) => {
        const employee = await employeeService.createEmployee(data)
        // Refresh list
        await get().fetchEmployees()
        return employee
    },

    updateEmployee: async (id: string, data) => {
        const employee = await employeeService.updateEmployee(id, data)
        set({ currentEmployee: employee })
        // Refresh list
        await get().fetchEmployees()
        return employee
    },

    deleteEmployee: async (id: string) => {
        await employeeService.deleteEmployee(id)
        await get().fetchEmployees()
    },

    fetchDocuments: async (employeeId: string) => {
        set({ isLoadingRelated: true })
        try {
            const documents = await employeeService.getDocuments(employeeId)
            set({ documents: Array.isArray(documents) ? documents : [], isLoadingRelated: false })
        } catch {
            set({ documents: [], isLoadingRelated: false })
        }
    },

    fetchSkills: async (employeeId: string) => {
        set({ isLoadingRelated: true })
        try {
            const skills = await employeeService.getSkills(employeeId)
            set({ skills, isLoadingRelated: false })
        } catch {
            set({ skills: [], isLoadingRelated: false })
        }
    },

    addSkill: async (employeeId, skillData) => {
        await employeeService.addEmployeeSkill(employeeId, skillData)
        await get().fetchSkills(employeeId)
    },

    fetchTimeline: async (employeeId: string) => {
        set({ isLoadingRelated: true })
        try {
            const timeline = await employeeService.getTimeline(employeeId)
            set({ timeline, isLoadingRelated: false })
        } catch {
            set({ timeline: [], isLoadingRelated: false })
        }
    },

    fetchDropdowns: async () => {
        try {
            const [departments, designations, locations] = await Promise.all([
                employeeService.getDepartments(),
                employeeService.getDesignations(),
                employeeService.getLocations(),
            ])
            set({
                departments: Array.isArray(departments) ? departments : [],
                designations: Array.isArray(designations) ? designations : [],
                locations: Array.isArray(locations) ? locations : []
            })
        } catch {
            // Silently fail for dropdowns but ensure arrays
            set({ departments: [], designations: [], locations: [] })
        }
    },

    fetchAvailableSkills: async () => {
        try {
            const skills = await employeeService.getAvailableSkills()
            set({ availableSkills: skills })
        } catch {
            set({ availableSkills: [] })
        }
    },

    uploadAvatar: async (employeeId, file) => {
        const response = await employeeService.uploadEmployeeAvatar(employeeId, file)
        if (response.success && get().currentEmployee) {
            // Update current employee avatar locally
            const updatedEmployee = {
                ...get().currentEmployee!,
                user: {
                    ...get().currentEmployee!.user,
                    avatar: response.avatar_url
                }
            }
            set({ currentEmployee: updatedEmployee })
        }
    },

    clearCurrentEmployee: () => {
        set({
            currentEmployee: null,
            documents: [],
            skills: [],
            timeline: [],
            detailError: null
        })
    },

    clearError: () => {
        set({ error: null, detailError: null })
    },
}))
