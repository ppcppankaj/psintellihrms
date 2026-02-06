import api from './index';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    employee_id: string | null;
    phone: string | null;
    avatar: string | null;
    is_superuser: boolean;
    roles: string[];
    permissions: string[];
    organization: {
        id: string;
        name: string;
        slug?: string;
        subscription_status?: string;
    } | null;
}

export const authService = {
    login: async (credentials: LoginRequest) => {
        const response = await api.post<LoginResponse>('/auth/login/', credentials);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get<UserProfile>('/auth/profile/');
        return response.data;
    },

    logout: () => {
        // Backend might handle token blacklisting, for now we just clear on frontend
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }
};
