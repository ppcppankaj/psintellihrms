import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type UserProfile } from '../../api/authService';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: UserProfile | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refresh_token'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
    isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ token: string; refreshToken?: string; user: UserProfile }>
        ) => {
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken || null;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            localStorage.setItem('token', action.payload.token);
            if (action.payload.refreshToken) {
                localStorage.setItem('refresh_token', action.payload.refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        logout: (state) => {
            state.token = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
