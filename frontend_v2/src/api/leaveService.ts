import api from './index';
import type { PaginatedResponse } from './types';

export interface LeaveType {
    id: string;
    name: string;
    count: number;
}

export interface LeaveRequest {
    id: string;
    employee: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export interface Holiday {
    id: string;
    name: string;
    date: string;
    is_optional: boolean;
}

export interface LeavePolicy {
    id: string;
    name: string;
    description: string;
    sandwich_rule: boolean;
}

export const leaveService = {
    getRequests: async (params?: any) => {
        const response = await api.get<PaginatedResponse<LeaveRequest>>('/leave/requests/', { params });
        return response.data;
    },

    getLeaveTypes: async (params?: any) => {
        const response = await api.get<PaginatedResponse<LeaveType>>('/leave/types/', { params });
        return response.data;
    },
    createLeaveType: async (data: Partial<LeaveType>) => {
        const response = await api.post<LeaveType>('/leave/types/', data);
        return response.data;
    },
    updateLeaveType: async (id: string, data: Partial<LeaveType>) => {
        const response = await api.put<LeaveType>(`/leave/types/${id}/`, data);
        return response.data;
    },
    deleteLeaveType: async (id: string) => {
        await api.delete(`/leave/types/${id}/`);
    },

    submitRequest: async (data: Omit<LeaveRequest, 'id' | 'status' | 'employee'>) => {
        const response = await api.post<LeaveRequest>('/leave/requests/', data);
        return response.data;
    },

    approveRequest: async (id: string) => {
        const response = await api.post<LeaveRequest>(`/leave/requests/${id}/approve/`);
        return response.data;
    },

    rejectRequest: async (id: string, reason: string) => {
        const response = await api.post(`/leave/requests/${id}/reject/`, { reason });
        return response.data;
    },
    getBalances: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/leave/balances/', { params });
        return response.data;
    },
    getEncashments: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/leave/encashments/', { params });
        return response.data;
    },

    // Holidays
    getHolidays: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Holiday>>('/leave/holidays/', { params });
        return response.data;
    },
    createHoliday: async (data: Partial<Holiday>) => {
        const response = await api.post<Holiday>('/leave/holidays/', data);
        return response.data;
    },
    updateHoliday: async (id: string, data: Partial<Holiday>) => {
        const response = await api.put<Holiday>(`/leave/holidays/${id}/`, data);
        return response.data;
    },
    deleteHoliday: async (id: string) => {
        await api.delete(`/leave/holidays/${id}/`);
    }
};
