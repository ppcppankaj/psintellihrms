/**
 * Signup Page - Tenant Registration UI
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { tenantService, type SignupConfig, type TenantSignupData } from '@/services/tenantService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SignupPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [config, setConfig] = useState<SignupConfig | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<TenantSignupData>({
        defaultValues: {
            country: 'India',
            timezone: 'Asia/Kolkata',
            currency: 'INR',
            date_format: 'DD/MM/YYYY',
        }
    })


    const selectedCountry = watch('country')

    // Fetch config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await tenantService.getConfig()
                setConfig(data)
            } catch (error) {
                console.error('Failed to fetch config:', error)
                toast.error('Failed to load configuration')
            }
        }
        fetchConfig()
    }, [])

    // Update currency and timezone when country changes
    useEffect(() => {
        if (config && selectedCountry) {
            const countryInfo = config.countries.find(c => c.name === selectedCountry)
            if (countryInfo) {
                setValue('currency', countryInfo.currency)
                setValue('timezone', countryInfo.timezone)
            }
        }
    }, [selectedCountry, config, setValue])

    const onSubmit = async (data: TenantSignupData) => {
        setIsLoading(true)
        try {
            await tenantService.signup(data)
            toast.success('Company registered successfully! Please check your email for verification.')
            navigate('/login')
        } catch (error: unknown) {
            const axiosError = error as import('axios').AxiosError<{ message?: string }>
            const message = axiosError.response?.data?.message || 'Failed to register company'
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const nextStep = () => setStep(step + 1)
    const prevStep = () => setStep(step - 1)

    return (
        <div className="min-h-screen flex bg-surface-50 dark:bg-surface-900">
            {/* Left side - Information */}
            <div className="hidden lg:flex lg:w-1/3 bg-primary-600 p-12 flex-col justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                >
                    <div className="flex items-center space-x-3 mb-12">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <span className="text-white font-bold text-lg">PS</span>
                        </div>
                        <span className="text-white font-display text-xl font-semibold">IntelliHR</span>
                    </div>

                    <h2 className="text-3xl font-display font-bold mb-6">
                        Take the first step towards better people management.
                    </h2>

                    <ul className="space-y-4 mb-12">
                        {[
                            '14-day free trial, no credit card required',
                            'Unified HR, Payroll, and Attendance',
                            'AI-powered insights for every employee',
                            'Secure, scalable enterprise-grade platform'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center">
                                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-3 text-xs">
                                    ✓
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Decorative circles */}
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-500/30 rounded-full blur-3xl"></div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20">
                <div className="mx-auto w-full max-w-lg">
                    <div className="mb-8">
                        <Link to="/login" className="inline-flex items-center text-sm text-surface-500 hover:text-surface-700 mb-6">
                            <ChevronLeftIcon className="w-4 h-4 mr-1" />
                            Back to login
                        </Link>
                        <h2 className="text-3xl font-display font-bold text-surface-900 dark:text-white">
                            Create your account
                        </h2>
                        <p className="mt-2 text-surface-600 dark:text-surface-400">
                            Step {step} of 2: {step === 1 ? 'Company Details' : 'Administrator Details'}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-surface-800 p-8 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="form-label">Company Name</label>
                                        <input
                                            {...register('name', { required: 'Company name is required' })}
                                            className="form-input"
                                            placeholder="Acme Inc."
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">Email</label>
                                            <input
                                                {...register('email', { required: 'Business email is required' })}
                                                type="email"
                                                className="form-input"
                                                placeholder="hr@acme.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Phone (Optional)</label>
                                            <input
                                                {...register('phone')}
                                                className="form-input"
                                                placeholder="+1..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Country</label>
                                        <select
                                            {...register('country', { required: 'Country is required' })}
                                            className="form-input"
                                        >
                                            {config?.countries.map(c => (
                                                <option key={c.code} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">Currency</label>
                                            <select
                                                {...register('currency', { required: 'Currency is required' })}
                                                className="form-input"
                                            >
                                                {config?.currencies.map(c => (
                                                    <option key={c.code} value={c.code}>{c.display}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label">Date Format</label>
                                            <select
                                                {...register('date_format', { required: 'Date format is required' })}
                                                className="form-input"
                                            >
                                                {config?.date_formats.map(df => (
                                                    <option key={df.code} value={df.code}>{df.display}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Timezone</label>
                                        <select
                                            {...register('timezone', { required: 'Timezone is required' })}
                                            className="form-input"
                                        >
                                            {config?.timezones.map(tz => (
                                                <option key={tz} value={tz}>{tz}</option>
                                            ))}
                                        </select>
                                    </div>


                                    <div className="pt-4">
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="w-full btn-primary py-3"
                                        >
                                            Next: Administrator Details
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">First Name</label>
                                            <input
                                                {...register('admin_first_name', { required: 'Required' })}
                                                className="form-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Last Name</label>
                                            <input
                                                {...register('admin_last_name', { required: 'Required' })}
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">Admin Email</label>
                                        <input
                                            {...register('admin_email', { required: 'Admin email is required' })}
                                            type="email"
                                            className="form-input"
                                            placeholder="admin@acme.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">Admin Password</label>
                                        <div className="relative">
                                            <input
                                                {...register('admin_password', {
                                                    required: 'Password is required',
                                                    minLength: { value: 8, message: 'Minimum 8 characters required' }
                                                })}
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-input pr-10"
                                                placeholder="••••••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
                                            >
                                                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {errors.admin_password && <p className="mt-1 text-sm text-red-500">{errors.admin_password.message}</p>}
                                    </div>

                                    <div className="pt-4 flex space-x-4">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="flex-1 btn-secondary py-3"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-[2] btn-primary py-3"
                                        >
                                            {isLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Complete Registration'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
