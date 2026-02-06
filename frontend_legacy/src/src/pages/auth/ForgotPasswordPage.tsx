/**
 * Forgot Password Page
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { authService } from '@/services/authService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>()

    const onSubmit = async (data: { email: string }) => {
        setIsLoading(true)
        try {
            await authService.forgotPassword(data.email)
            setIsSuccess(true)
        } catch {
            toast.error('Failed to send reset email. Please try again.')
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
                    {isSuccess ? (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white mb-2">
                                Check your email
                            </h1>
                            <p className="text-surface-600 dark:text-surface-400 mb-6">
                                We've sent a password reset link to your email address.
                            </p>
                            <Link to="/login" className="btn-primary inline-flex">
                                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <EnvelopeIcon className="w-8 h-8 text-primary-600" />
                                </div>
                                <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white mb-2">
                                    Forgot password?
                                </h1>
                                <p className="text-surface-600 dark:text-surface-400">
                                    No worries, we'll send you reset instructions.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="form-label">
                                        Email address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
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

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-primary py-3"
                                >
                                    {isLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Send reset link'}
                                </button>
                            </form>

                            <Link
                                to="/login"
                                className="mt-6 flex items-center justify-center text-sm text-surface-600 hover:text-primary-600"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                Back to login
                            </Link>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
