import api from './index';
import type { PaginatedResponse } from './types';

export interface Employee {
    id: string;
    user: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    department: { id: string; name: string } | string;
    department_name?: string;
    designation: { id: string; name: string } | string;
    designation_name?: string;
    location?: { id: string; name: string } | string;
    location_name?: string;
    reporting_manager: string | null;
    manager_name?: string;
    date_of_joining: string;
    employee_id: string;
    employment_status: 'active' | 'probation' | 'notice_period' | 'inactive' | 'terminated';
    employment_type: string;
    avatar?: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    description: string;
    parent?: string;
    parent_name?: string; // Read-only from backend
    head?: string;
    head_name?: string; // Read-only from backend
    branch?: string;
    cost_center?: string;
}

export interface Designation {
    id: string;
    name: string;
    code: string;
    level: number;
    grade: string;
    job_family?: string;
    min_salary?: number;
    max_salary?: number;
    description?: string;
}

export interface Location {
    id: string;
    name: string;
    code: string;
    city: string;
    state: string;
    country: string;
    timezone: string;
    // Expanded fields
    address_line1?: string; // Optional in list, likely present in detail
    address_line2?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    geo_fence_radius?: number;
    is_headquarters?: boolean;
}

export const employeeService = {
    getEmployees: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Employee>>('/employees/', { params });
        return response.data;
    },

    getEmployee: async (id: string) => {
        const response = await api.get<Employee>(`/employees/${id}/`);
        return response.data;
    },

    createEmployee: async (data: Partial<Employee>) => {
        const response = await api.post<Employee>('/employees/', data);
        return response.data;
    },

    updateEmployee: async (id: string, data: Partial<Employee>) => {
        const response = await api.put<Employee>(`/employees/${id}/`, data);
        return response.data;
    },

    deleteEmployee: async (id: string) => {
        await api.delete(`/employees/${id}/`);
    },

    // Departments
    getDepartments: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Department>>('/employees/departments/', { params });
        return response.data;
    },
    createDepartment: async (data: Partial<Department>) => {
        const response = await api.post<Department>('/employees/departments/', data);
        return response.data;
    },
    updateDepartment: async (id: string, data: Partial<Department>) => {
        const response = await api.put<Department>(`/employees/departments/${id}/`, data);
        return response.data;
    },
    deleteDepartment: async (id: string) => {
        await api.delete(`/employees/departments/${id}/`);
    },

    // Designations
    getDesignations: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Designation>>('/employees/designations/', { params });
        return response.data;
    },
    createDesignation: async (data: Partial<Designation>) => {
        const response = await api.post<Designation>('/employees/designations/', data);
        return response.data;
    },
    updateDesignation: async (id: string, data: Partial<Designation>) => {
        const response = await api.put<Designation>(`/employees/designations/${id}/`, data);
        return response.data;
    },
    deleteDesignation: async (id: string) => {
        await api.delete(`/employees/designations/${id}/`);
    },

    // Locations
    getLocations: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Location>>('/employees/locations/', { params });
        return response.data;
    },
    createLocation: async (data: Partial<Location>) => {
        const response = await api.post<Location>('/employees/locations/', data);
        return response.data;
    },
    updateLocation: async (id: string, data: Partial<Location>) => {
        const response = await api.put<Location>(`/employees/locations/${id}/`, data);
        return response.data;
    },
    deleteLocation: async (id: string) => {
        await api.delete(`/employees/locations/${id}/`);
    },
    getTransfers: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/employees/transfers/', { params });
        return response.data;
    },
    getPromotions: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/employees/promotions/', { params });
        return response.data;
    },
    getResignations: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/employees/resignations/', { params });
        return response.data;
    }
};
