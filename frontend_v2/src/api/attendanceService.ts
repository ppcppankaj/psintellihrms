import api from './index';
import type { PaginatedResponse } from './types';

export interface AttendanceRecord {
    id: string;
    employee: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    total_hours: string;
    status: 'present' | 'absent' | 'late' | 'on_leave';
}

export interface Shift {
    id: string;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    working_hours: number;
}

export interface GeoFence {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
}

export const attendanceService = {
    getRecords: async (params?: any) => {
        const response = await api.get<PaginatedResponse<AttendanceRecord>>('/attendance/records/', { params });
        return response.data;
    },

    checkIn: async (data: { latitude?: number; longitude?: number }) => {
        const response = await api.post<AttendanceRecord>('/attendance/records/check-in/', data);
        return response.data;
    },

    checkOut: async (data: { latitude: number; longitude: number; photo?: string }) => {
        const response = await api.post('/attendance/records/check-out/', data);
        return response.data;
    },
    getPunches: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/attendance/punches/', { params });
        return response.data;
    },
    getFraudLogs: async (params?: any) => {
        const response = await api.get<PaginatedResponse<any>>('/attendance/fraud-logs/', { params });
        return response.data;
    },

    // Shifts
    getShifts: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Shift>>('/attendance/shifts/', { params });
        return response.data;
    },
    createShift: async (data: Partial<Shift>) => {
        const response = await api.post<Shift>('/attendance/shifts/', data);
        return response.data;
    },
    updateShift: async (id: string, data: Partial<Shift>) => {
        const response = await api.put<Shift>(`/attendance/shifts/${id}/`, data);
        return response.data;
    },
    deleteShift: async (id: string) => {
        await api.delete(`/attendance/shifts/${id}/`);
    },

    // GeoFences
    getGeoFences: async (params?: any) => {
        const response = await api.get<PaginatedResponse<GeoFence>>('/attendance/geo-fences/', { params });
        return response.data;
    },
    createGeoFence: async (data: Partial<GeoFence>) => {
        const response = await api.post<GeoFence>('/attendance/geo-fences/', data);
        return response.data;
    },
    updateGeoFence: async (id: string, data: Partial<GeoFence>) => {
        const response = await api.put<GeoFence>(`/attendance/geo-fences/${id}/`, data);
        return response.data;
    },
    deleteGeoFence: async (id: string) => {
        await api.delete(`/attendance/geo-fences/${id}/`);
    }
};
