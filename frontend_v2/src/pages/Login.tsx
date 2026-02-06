import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';
import { authService } from '../api/authService';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Login to get tokens
            const tokens = await authService.login({ email, password });

            // Store tokens temporarily in local variable to use for profile fetch
            // Note: Axios interceptor will use the token from store, but we haven't set it yet
            // So we might need to pass it or wait for store update.
            // But setCredentials will update store.

            // 2. Fetch profile
            // We set credentials with token first so interceptor can use it for profile call
            // Actually, it's better to fetch profile and then set all at once

            // But we need the token in the header for getProfile.
            // Let's set the token in localStorage manually for a moment or use a manual header
            localStorage.setItem('token', tokens.access);

            const userProfile = await authService.getProfile();

            dispatch(setCredentials({
                token: tokens.access,
                refreshToken: tokens.refresh,
                user: userProfile
            }));

            // Role-based redirection
            if (userProfile.is_superuser) {
                navigate('/superadmin');
            } else if (userProfile.roles.includes('org_admin')) {
                navigate('/admin');
            } else {
                navigate('/employee');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">PS Intelli - HR</h1>
                    <p className="text-slate-400">Enterprise Resource Management</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    <p>© 2026 PS Intelli - HR. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
