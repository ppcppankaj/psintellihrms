/**
 * Login Page - Authentication UI
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { getApiErrorMessage } from '@/utils/apiErrors'
import type { LoginCredentials } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginCredentials>()

    const onSubmit = async (data: LoginCredentials) => {
        setIsLoading(true)
        try {
            console.log('[Login] Calling authService.login()')
            const response = await authService.login(data)
            console.log('[Login] Login response:', { user: response.user?.email, hasTokens: !!response.tokens })

            if (response.requires_2fa) {
                // Redirect to 2FA page
                navigate('/2fa', { state: { sessionId: response.session_id } })
                return
            }

            // Successful login
            console.log('[Login] Calling login() to set state')
            login(response.user, response.tokens)
            console.log('[Login] State set, navigating...')
            toast.success(`Welcome back, ${response.user.first_name}!`)
            
            // Redirect superusers to admin dashboard, others to regular dashboard
            const redirectPath = response.user.is_superuser ? '/admin/dashboard' : '/dashboard'
            console.log('[Login] Navigating to:', redirectPath)
            navigate(redirectPath)
        } catch (error: unknown) {
            console.error('[Login] Login failed:', error)
            const message = getApiErrorMessage(error, 'Invalid credentials')
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <span className="text-white font-bold text-xl">PS</span>
                            </div>
                            <span className="text-white font-display text-2xl font-semibold">Intelli - HR</span>
                        </div>

                        <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-6">
                            AI-Powered
                            <br />
                            <span className="text-primary-200">People Management</span>
                        </h1>

                        <p className="text-primary-100 text-lg max-w-md">
                            Transform your HR operations with intelligent automation, real-time insights,
                            and seamless employee experiences.
                        </p>

                        <div className="mt-12 flex items-center space-x-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">500+</div>
                                <div className="text-sm text-primary-200">Companies</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">1M+</div>
                                <div className="text-sm text-primary-200">Employees</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">99.9%</div>
                                <div className="text-sm text-primary-200">Uptime</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative circles */}
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl"></div>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"></div>
            </div>

            {/* Right side - Login form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-surface-50 dark:bg-surface-900">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">PS</span>
                            </div>
                            <span className="font-display text-xl font-semibold text-surface-900 dark:text-white">
                                IntelliHR
                            </span>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-white">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-surface-600 dark:text-surface-400">
                            Sign in to your account to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="form-label">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                                placeholder="you@company.com"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address',
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="form-label mb-0">
                                    Password
                                </label>
                                
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    className={`form-input pr-10 ${errors.password ? 'form-input-error' : ''}`}
                                    placeholder="••••••••"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 8,
                                            message: 'Password must be at least 8 characters',
                                        },
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="w-5 h-5" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    Forgot password?
                                </Link>

                        {/* Remember me */}
                        <div className="flex items-center">
                            <input
                                id="remember_me"
                                type="checkbox"
                                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                {...register('remember_me')}
                            />
                            <label htmlFor="remember_me" className="ml-2 text-sm text-surface-600 dark:text-surface-400">
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3 text-base"
                        >
                            {isLoading ? (
                                <LoadingSpinner size="sm" className="mx-auto" />
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-surface-600 dark:text-surface-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                            Start your free trial
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
