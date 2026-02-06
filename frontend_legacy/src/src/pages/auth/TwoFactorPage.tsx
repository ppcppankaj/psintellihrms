/**
 * Two-Factor Authentication Page
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function TwoFactorPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuthStore()
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [isLoading, setIsLoading] = useState(false)

    const sessionId = (location.state as { sessionId?: string })?.sessionId

    // Redirect if no session
    if (!sessionId) {
        navigate('/login')
        return null
    }

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return

        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`)
            nextInput?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`)
            prevInput?.focus()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const fullCode = code.join('')

        if (fullCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code')
            return
        }

        setIsLoading(true)
        try {
            const response = await authService.verify2FA(fullCode, sessionId)
            login(response.user, response.tokens)
            toast.success('Verification successful!')
            navigate('/dashboard')
        } catch (error: unknown) {
            const axiosError = error as import('axios').AxiosError<{ message?: string }>
            const message = axiosError.response?.data?.message || 'Invalid verification code'
            toast.error(message)
            setCode(['', '', '', '', '', ''])
            document.getElementById('code-0')?.focus()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="glass-card p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
                    </div>

                    <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white mb-2">
                        Two-Factor Authentication
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mb-8">
                        Enter the 6-digit code from your authenticator app
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-center gap-3 mb-8">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`code-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-mono font-bold form-input"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary py-3"
                        >
                            {isLoading ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Verify'}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-surface-500">
                        Lost access to your authenticator?{' '}
                        <button className="text-primary-600 hover:underline">
                            Use backup code
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
