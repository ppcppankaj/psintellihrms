import api from './index';

export interface User {
    id: string;
    username: string;
    email: string;
    employee_id?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    full_name?: string;
    phone?: string;
    gender?: string;
    date_of_birth?: string;
    is_active: boolean;
    is_superuser: boolean;
    is_org_admin: boolean;
    role?: string;
    roles?: string[];
    organization?: any;
    last_login?: string | null;
}

export const userService = {
    getProfile: async () => {
        const response = await api.get<User>('/users/me/');
        return response.data;
    },

    getUsers: async (params?: any) => {
        const response = await api.get<{ results: User[]; count: number }>('/auth/users/', { params });
        return response.data;
    },

    createUser: async (data: Partial<User>) => {
        const response = await api.post<User>('/auth/users/', data);
        return response.data;
    },

    updateUser: async (id: string, data: Partial<User>) => {
        const response = await api.put<User>(`/auth/users/${id}/`, data);
        return response.data;
    },

    deleteUser: async (id: string) => {
        await api.delete(`/auth/users/${id}/`);
    },
};
