/**
 * EmployeeForm Component - Create/Edit employee form
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmployeeStore } from '@/store/employeeStore'
import Card, { CardHeader, CardContent } from '@/components/ui/Card'
import { CameraIcon, UserIcon } from '@heroicons/react/24/outline'
import { abacService, Policy, UserPolicy } from '@/services/abacService'

interface EmployeeFormProps {
    employeeId?: string
    mode: 'create' | 'edit'
}

export default function EmployeeForm({ employeeId, mode }: EmployeeFormProps) {
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        currentEmployee,
        departments,
        designations,
        locations,
        fetchEmployee,
        fetchDropdowns,
        createEmployee,
        updateEmployee,
        uploadAvatar,
        isLoadingDetail
    } = useEmployeeStore()

    const [formData, setFormData] = useState({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: 'Welcome@123', // Default password for new employees
        department_id: '',
        designation_id: '',
        location_id: '',
        employment_type: 'full_time',
        employment_status: 'probation',
        date_of_joining: new Date().toISOString().split('T')[0],
        date_of_birth: '',
        gender: '',
        marital_status: '',
        blood_group: '',
        pan_number: '',
        aadhaar_number: '',
        uan_number: '',
        pf_number: '',
        esi_number: '',
        work_mode: 'office',
        policy_ids: [] as string[],
    })

    const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([])
    const [userPolicies, setUserPolicies] = useState<UserPolicy[]>([])
    const [isLoadingPolicies, setIsLoadingPolicies] = useState(false)

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

    // Load dropdowns and employee data
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingPolicies(true)
            try {
                const policyResp = await abacService.policies.list()
                const policies = Array.isArray(policyResp)
                    ? policyResp
                    : Array.isArray(policyResp?.results)
                        ? policyResp.results
                        : Array.isArray((policyResp as any)?.data)
                            ? (policyResp as any).data
                            : []
                setAvailablePolicies(policies)
            } finally {
                setIsLoadingPolicies(false)
            }
            fetchDropdowns()
        }

        loadInitialData()

        if (mode === 'edit' && employeeId) {
            fetchEmployee(employeeId)
        }
    }, [mode, employeeId, fetchDropdowns, fetchEmployee])

    // Populate form when employee is loaded
    useEffect(() => {
        if (mode === 'edit' && currentEmployee) {
            setFormData({
                employee_id: currentEmployee.employee_id,
                first_name: currentEmployee.user?.first_name || '',
                last_name: currentEmployee.user?.last_name || '',
                email: currentEmployee.user?.email || '',
                phone: currentEmployee.user?.phone || '',
                password: '', // Password not editable/visible in edit mode
                department_id: currentEmployee.department?.id || '',
                designation_id: currentEmployee.designation?.id || '',
                location_id: currentEmployee.location?.id || '',
                employment_type: currentEmployee.employment_type,
                employment_status: currentEmployee.employment_status,
                date_of_joining: currentEmployee.date_of_joining,
                date_of_birth: currentEmployee.date_of_birth || '',
                gender: currentEmployee.gender || '',
                marital_status: currentEmployee.marital_status || '',
                blood_group: currentEmployee.blood_group || '',
                pan_number: currentEmployee.pan_number || '',
                aadhaar_number: currentEmployee.aadhaar_number || '',
                uan_number: currentEmployee.uan_number || '',
                pf_number: currentEmployee.pf_number || '',
                esi_number: currentEmployee.esi_number || '',
                work_mode: currentEmployee.work_mode,
                policy_ids: [],
            })
            // Load ABAC user policies for this user
            if (currentEmployee.user?.id) {
                abacService.userPolicies.list({ user_id: currentEmployee.user.id })
                    .then((resp) => {
                        const up = resp?.results || resp || []
                        setUserPolicies(up)
                        setFormData(prev => ({ ...prev, policy_ids: up.map((p: { policy_id: string }) => p.policy_id) }))
                    })
                    .catch(() => {
                        setUserPolicies([])
                    })
            }
        }
    }, [mode, currentEmployee])

    // Auto-generate employee ID from initials
    const handleNameBlur = () => {
        if (mode === 'create' && !formData.employee_id && formData.first_name) {
            const fInitial = formData.first_name.charAt(0).toUpperCase()
            const lInitial = formData.last_name.charAt(0).toUpperCase() || 'X'
            const random = Math.floor(1000 + Math.random() * 9000)
            const id = `${fInitial}${lInitial}${random}`
            setFormData(prev => ({ ...prev, employee_id: id }))
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleAvatarClick = () => {
        if (mode === 'edit') {
            fileInputRef.current?.click()
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && employeeId) {
            try {
                await uploadAvatar(employeeId, file)
            } catch (error) {
                console.error('Avatar upload failed:', error)
            }
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.employee_id) newErrors.employee_id = 'Employee ID is required'
        if (!formData.first_name) newErrors.first_name = 'First name is required'
        if (!formData.last_name) newErrors.last_name = 'Last name is required'
        if (!formData.email) newErrors.email = 'Email is required'
        if (!formData.date_of_joining) newErrors.date_of_joining = 'Date of joining is required'
        if (mode === 'create' && !formData.password) newErrors.password = 'Password is required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setIsSubmitting(true)
        try {
            const { policy_ids, ...payload } = formData
            if (mode === 'create') {
                const response = await createEmployee(payload) as any
                // Assign selected policies to new user
                if (response?.user?.id && policy_ids.length) {
                    await Promise.all(
                        policy_ids.map(pid => abacService.userPolicies.create({ user_id: response.user.id, policy_id: pid }))
                    )
                }
                // If backend returns the password, we can show it
                if (response?.password) {
                    setGeneratedPassword(response.password)
                } else {
                    navigate('/employees')
                }
            } else if (employeeId) {
                await updateEmployee(employeeId, payload)
                // Sync user policies: add new, remove unchecked
                if (currentEmployee?.user?.id) {
                    const currentMap = Object.fromEntries(userPolicies.map(up => [up.policy_id, up.id]))
                    const selected = new Set(policy_ids)
                    const toAdd = policy_ids.filter(pid => !currentMap[pid])
                    const toRemove = userPolicies.filter(up => !selected.has(up.policy_id)).map(up => up.id)

                    await Promise.all([
                        ...toAdd.map(pid => abacService.userPolicies.create({ user_id: currentEmployee.user.id, policy_id: pid })),
                        ...toRemove.map(id => abacService.userPolicies.delete(id))
                    ])
                }
                navigate('/employees')
            }
        } catch (error: unknown) {
            const axiosError = error as import('axios').AxiosError<any>
            const serverMsg = axiosError.response?.data?.message
            const detail = typeof axiosError.response?.data === 'string'
                ? axiosError.response?.data
                : JSON.stringify(axiosError.response?.data)
            setErrors({ submit: serverMsg || detail || 'Failed to save employee' })
            // Surface in console for quick debugging of payload/validation issues
            console.error('Employee save failed', axiosError.response?.status, axiosError.response?.data)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoadingDetail && mode === 'edit') {
        return <FormSkeleton />
    }

    if (generatedPassword) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-surface-900 mb-2">Employee Created Successfully!</h2>
                    <p className="text-surface-600 mb-6">Please share the following credentials with the employee:</p>
                    <div className="bg-surface-50 p-6 rounded-lg mb-8 inline-block text-left">
                        <p className="text-sm font-medium text-surface-500 mb-1">Username (Email)</p>
                        <p className="text-lg font-bold text-surface-900 mb-4">{formData.email}</p>
                        <p className="text-sm font-medium text-surface-500 mb-1">Temporary Password</p>
                        <p className="text-lg font-bold text-primary-600">{generatedPassword}</p>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate('/employees')}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Back to Employee List
                        </button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            {mode === 'edit' && (
                <div className="flex flex-col items-center">
                    <div
                        onClick={handleAvatarClick}
                        className="relative group cursor-pointer"
                    >
                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-surface-700 shadow-lg overflow-hidden bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                            {currentEmployee?.user?.avatar ? (
                                <img
                                    src={currentEmployee.user.avatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIcon className="w-16 h-16 text-surface-400" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                            <CameraIcon className="w-8 h-8 text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <p className="mt-2 text-sm text-surface-500">Click to change profile picture</p>
                </div>
            )}

            {/* Basic Information */}
            <Card>
                <CardHeader title="Basic Information" subtitle="Employee identification and contact details" />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="First Name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            error={errors.first_name}
                            required
                        />
                        <InputField
                            label="Last Name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            error={errors.last_name}
                            required
                        />
                        <InputField
                            label="Employee ID"
                            name="employee_id"
                            value={formData.employee_id}
                            onChange={handleChange}
                            error={errors.employee_id}
                            required
                            disabled={mode === 'edit'}
                        />
                        <InputField
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            required
                        />
                        {mode === 'create' && (
                            <InputField
                                label="Initial Password"
                                name="password"
                                type="text"
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                required
                            />
                        )}
                        <InputField
                            label="Phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Personal Details */}
            <Card>
                <CardHeader title="Personal Details" subtitle="Demographics and identity documents" />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputField
                            label="Date of Birth"
                            name="date_of_birth"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                        />
                        <SelectField
                            label="Gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Select...' },
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' },
                                { value: 'other', label: 'Other' },
                                { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                            ]}
                        />
                        <SelectField
                            label="Marital Status"
                            name="marital_status"
                            value={formData.marital_status}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Select...' },
                                { value: 'single', label: 'Single' },
                                { value: 'married', label: 'Married' },
                                { value: 'divorced', label: 'Divorced' },
                                { value: 'widowed', label: 'Widowed' },
                            ]}
                        />
                        <SelectField
                            label="Blood Group"
                            name="blood_group"
                            value={formData.blood_group}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Select...' },
                                { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                                { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                                { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                                { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                            ]}
                        />
                        <InputField
                            label="PAN Number"
                            name="pan_number"
                            value={formData.pan_number}
                            onChange={handleChange}
                        />
                        <InputField
                            label="Aadhaar Number"
                            name="aadhaar_number"
                            value={formData.aadhaar_number}
                            onChange={handleChange}
                        />
                        <InputField
                            label="UAN"
                            name="uan_number"
                            value={formData.uan_number}
                            onChange={handleChange}
                        />
                        <InputField
                            label="PF Number"
                            name="pf_number"
                            value={formData.pf_number}
                            onChange={handleChange}
                        />
                        <InputField
                            label="ESI Number"
                            name="esi_number"
                            value={formData.esi_number}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Organization */}
            <Card>
                <CardHeader title="Organization" subtitle="Department, designation, and reporting structure" />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField
                            label="Department"
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Select Department...' },
                                ...departments.map(d => ({ value: d.id, label: d.name }))
                            ]}
                        />
                        <SelectField
                            label="Designation"
                            name="designation_id"
                            value={formData.designation_id}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Select Designation...' },
                                ...designations.map(d => ({ value: d.id, label: d.name }))
                            ]}
                        />
                        <SelectField
                            label="Location"
                            name="location_id"
                            value={formData.location_id}
                            onChange={handleChange}
                            options={[
                                { value: '', label: 'Select Location...' },
                                ...locations.map(l => ({ value: l.id, label: `${l.name}, ${l.city}` }))
                            ]}
                        />
                        <SelectField
                            label="Work Mode"
                            name="work_mode"
                            value={formData.work_mode}
                            onChange={handleChange}
                            options={[
                                { value: 'office', label: 'Office' },
                                { value: 'remote', label: 'Remote' },
                                { value: 'hybrid', label: 'Hybrid' },
                            ]}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Role Assignment */}
            <Card>
                <CardHeader title="Policies & Access" subtitle="Assign ABAC policies to this employee" />
                <CardContent>
                    {isLoadingPolicies ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availablePolicies.map((policy) => (
                                <label
                                    key={policy.id}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                        ${formData.policy_ids.includes(policy.id)
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800'
                                        }
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.policy_ids.includes(policy.id)}
                                        onChange={() => {
                                            const next = formData.policy_ids.includes(policy.id)
                                                ? formData.policy_ids.filter(id => id !== policy.id)
                                                : [...formData.policy_ids, policy.id]
                                            setFormData(prev => ({ ...prev, policy_ids: next }))
                                        }}
                                        className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-surface-900 dark:text-white">{policy.name}</p>
                                        <p className="text-xs text-surface-500 truncate max-w-[200px]">{policy.description || policy.code}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submit */}
            {errors.submit && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                    {errors.submit}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/employees')}
                    className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Employee' : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}

// Reusable input field
function InputField({
    label,
    name,
    type = 'text',
    value,
    onChange,
    onBlur,
    error,
    required,
    disabled,
}: {
    label: string
    name: string
    type?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: () => void
    error?: string
    required?: boolean
    disabled?: boolean
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value ?? ''}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                className={`
          w-full px-3 py-2 rounded-lg border
          ${error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-surface-300 dark:border-surface-600 focus:ring-primary-500'
                    }
          bg-white dark:bg-surface-800
          text-surface-900 dark:text-white
          focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    )
}

// Reusable select field
function SelectField({
    label,
    name,
    value,
    onChange,
    options,
    required,
}: {
    label: string
    name: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { value: string; label: string }[]
    required?: boolean
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}

// Skeleton loader
function FormSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface-100 dark:bg-surface-800 rounded-xl h-48" />
            ))}
        </div>
    )
}
