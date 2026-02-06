/**
 * Reset Password Page
 */

import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { authService } from '@/services/authService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ResetForm {
    password: string
    confirmPassword: string
}

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const { token } = useParams<{ token: string }>()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetForm>()

    const password = watch('password')

    const onSubmit = async (data: ResetForm) => {
        if (!token) return

        setIsLoading(true)
        try {
            await authService.resetPassword(token, data.password)
            toast.success('Password reset successful!')
            navigate('/login')
        } catch {
            toast.error('Failed to reset password. The link may be expired.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="glass-card p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <LockClosedIcon className="w-8 h-8 text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white mb-2">
                            Set new password
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400">
                            Your new password must be at least 12 characters.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label htmlFor="password" className="form-label">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-input pr-10 ${errors.password ? 'form-input-error' : ''}`}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 12,
                                            message: 'Password must be at least 12 characters',
                                        },
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
                                >
                                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) => value === password || 'Passwords do not match',
                                })}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3"
                        >
                            {isLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Reset password'}
                        </button>
                    </form>

                    <Link
                        to="/login"
                        className="mt-6 block text-center text-sm text-surface-600 hover:text-primary-600"
                    >
                        Back to login
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
