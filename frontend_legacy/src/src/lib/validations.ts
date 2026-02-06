/**
 * Zod Validation Schemas - Centralized form validation
 *
 * Purpose: Provide type-safe schema validation for all complex forms.
 * Used with react-hook-form via @hookform/resolvers/zod
 */

import { z } from 'zod'

// ============================================================================
// Common Validation Patterns
// ============================================================================

/**
 * Email validation - RFC-compliant with reasonable length limits
 */
const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(254, 'Email is too long')

/**
 * Phone validation - international format support
 */
const phoneSchema = z
    .string()
    .regex(/^[+]?[\d\s\-()]{7,20}$/, 'Invalid phone format')
    .optional()
    .or(z.literal(''))

/**
 * Date string validation (YYYY-MM-DD format)
 */
const dateStringSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')

/**
 * Optional date string
 */
const optionalDateSchema = dateStringSchema.optional().or(z.literal(''))

/**
 * Password with strength requirements
 */
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')

/**
 * UUID format validation
 */
const uuidSchema = z.string().uuid('Invalid ID format')

/**
 * Optional UUID (for foreign key references)
 */
const optionalUuidSchema = uuidSchema.optional().or(z.literal(''))

// ============================================================================
// Employee Schemas
// ============================================================================

/**
 * Employee Create Form Schema
 */
export const employeeCreateSchema = z.object({
    employee_id: z
        .string()
        .min(2, 'Employee ID must be at least 2 characters')
        .max(20, 'Employee ID is too long')
        .regex(/^[A-Z0-9]+$/i, 'Employee ID must be alphanumeric'),

    first_name: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name is too long')
        .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

    last_name: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name is too long')
        .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),

    email: emailSchema,

    phone: phoneSchema,

    password: passwordSchema,

    department_id: optionalUuidSchema,

    designation_id: optionalUuidSchema,

    location_id: optionalUuidSchema,

    reporting_manager_id: optionalUuidSchema,

    employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern', 'consultant'], {
        error: 'Please select an employment type'
    }),

    employment_status: z.enum(['active', 'probation', 'notice_period', 'inactive', 'terminated'], {
        error: 'Please select an employment status'
    }),

    date_of_joining: dateStringSchema.refine(
        (date) => new Date(date) <= new Date(),
        { message: 'Date of joining cannot be in the future' }
    ),

    date_of_birth: optionalDateSchema.refine(
        (date) => {
            if (!date) return true
            const dob = new Date(date)
            const minAge = new Date()
            minAge.setFullYear(minAge.getFullYear() - 16)
            return dob <= minAge
        },
        { message: 'Employee must be at least 16 years old' }
    ),

    gender: z.enum(['male', 'female', 'other', '']).optional(),

    marital_status: z.enum(['single', 'married', 'divorced', 'widowed', '']).optional(),

    blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).optional(),

    pan_number: z
        .string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format')
        .optional()
        .or(z.literal('')),

    aadhaar_number: z
        .string()
        .regex(/^\d{12}$/, 'Aadhaar must be 12 digits')
        .optional()
        .or(z.literal('')),

    uan_number: z
        .string()
        .regex(/^\d{12}$/, 'UAN must be 12 digits')
        .optional()
        .or(z.literal('')),

    pf_number: z.string().max(22).optional().or(z.literal('')),

    esi_number: z.string().max(17).optional().or(z.literal('')),

    work_mode: z.enum(['office', 'remote', 'hybrid']),

    policy_ids: z.array(z.string()).optional(),
})

export type EmployeeCreateFormData = z.infer<typeof employeeCreateSchema>

/**
 * Employee Edit Form Schema (password optional)
 */
export const employeeEditSchema = employeeCreateSchema.omit({ password: true }).extend({
    password: z.string().optional().or(z.literal('')),
})

export type EmployeeEditFormData = z.infer<typeof employeeEditSchema>

// ============================================================================
// Tenant/Organization Schemas
// ============================================================================

/**
 * Tenant Signup Schema
 */
export const tenantSignupSchema = z.object({
    organization_name: z
        .string()
        .min(2, 'Organization name must be at least 2 characters')
        .max(100, 'Organization name is too long'),

    schema_name: z
        .string()
        .min(3, 'Schema name must be at least 3 characters')
        .max(63, 'Schema name is too long')
        .regex(/^[a-z][a-z0-9_]*$/, 'Schema name must start with a letter and contain only lowercase letters, numbers, and underscores'),

    admin_email: emailSchema,

    admin_first_name: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name is too long'),

    admin_last_name: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name is too long'),

    admin_password: passwordSchema,

    confirm_password: z.string().min(1, 'Please confirm your password'),

    plan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),

    industry: z.string().optional(),

    employee_count: z.enum(['1-10', '11-50', '51-200', '201-500', '500+'] as const).optional(),

    terms_accepted: z.literal(true, {
        error: 'You must accept the terms and conditions'
    }),
}).refine((data) => data.admin_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
})

export type TenantSignupFormData = z.infer<typeof tenantSignupSchema>

// ============================================================================
// Leave Schemas
// ============================================================================

/**
 * Leave Application Schema
 */
export const leaveApplySchema = z.object({
    leave_type: z.string().min(1, 'Leave type is required'),

    start_date: dateStringSchema.refine(
        (date) => new Date(date) >= new Date(new Date().toDateString()),
        { message: 'Start date cannot be in the past' }
    ),

    end_date: dateStringSchema,

    start_day_type: z.enum(['full', 'first_half', 'second_half']).default('full'),

    end_day_type: z.enum(['full', 'first_half', 'second_half']).default('full'),

    reason: z
        .string()
        .min(10, 'Reason must be at least 10 characters')
        .max(500, 'Reason is too long'),

    contact_number: phoneSchema,

    contact_address: z.string().max(200).optional().or(z.literal('')),
}).refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    {
        message: 'End date must be on or after start date',
        path: ['end_date'],
    }
)

export type LeaveApplyFormData = z.infer<typeof leaveApplySchema>

// ============================================================================
// Attendance Schemas
// ============================================================================

/**
 * Punch Request Schema
 */
export const punchRequestSchema = z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    notes: z.string().max(200).optional().or(z.literal('')),
    work_mode: z.enum(['office', 'remote', 'hybrid']).optional(),
})

export type PunchRequestFormData = z.infer<typeof punchRequestSchema>

/**
 * Regularization Request Schema
 */
export const regularizationSchema = z.object({
    check_in: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format').optional(),
    check_out: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format').optional(),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
}).refine(
    (data) => data.check_in || data.check_out,
    { message: 'Either check-in or check-out time must be provided' }
)

export type RegularizationFormData = z.infer<typeof regularizationSchema>

// ============================================================================
// Payroll Schemas
// ============================================================================

/**
 * Tax Declaration Schema
 */
export const taxDeclarationSchema = z.object({
    regime: z.enum(['old', 'new']),

    section_80c: z.number().min(0).max(150000, 'Section 80C limit is ₹1.5 lakh').default(0),
    section_80d: z.number().min(0).max(100000, 'Section 80D limit is ₹1 lakh').default(0),
    section_80g: z.number().min(0).default(0),
    hra_exemption: z.number().min(0).default(0),
    lta: z.number().min(0).default(0),
    other_exemptions: z.number().min(0).default(0),
})

export type TaxDeclarationFormData = z.infer<typeof taxDeclarationSchema>

/**
 * Reimbursement Request Schema
 */
export const reimbursementSchema = z.object({
    type: z.enum(['medical', 'travel', 'food', 'phone', 'internet', 'other']),
    amount: z.number().positive('Amount must be greater than zero').max(1000000, 'Amount is too large'),
    description: z.string().min(5, 'Description must be at least 5 characters').max(500),
    receipt_file: z.instanceof(File).optional(),
})

export type ReimbursementFormData = z.infer<typeof reimbursementSchema>

// ============================================================================
// Recruitment Schemas
// ============================================================================

/**
 * Job Posting Schema
 */
export const jobPostingSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    department_id: uuidSchema,
    location_id: uuidSchema,

    employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern']),

    experience_min: z.number().min(0).max(50).default(0),
    experience_max: z.number().min(0).max(50),

    salary_min: z.number().min(0).optional(),
    salary_max: z.number().min(0).optional(),

    description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
    requirements: z.string().min(20, 'Requirements must be at least 20 characters').max(3000),

    skills: z.array(z.string()).min(1, 'At least one skill is required'),

    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),

    deadline: optionalDateSchema,
}).refine(
    (data) => data.experience_max >= data.experience_min,
    {
        message: 'Maximum experience must be greater than or equal to minimum',
        path: ['experience_max'],
    }
).refine(
    (data) => {
        if (data.salary_min && data.salary_max) {
            return data.salary_max >= data.salary_min
        }
        return true
    },
    {
        message: 'Maximum salary must be greater than or equal to minimum',
        path: ['salary_max'],
    }
)

export type JobPostingFormData = z.infer<typeof jobPostingSchema>

/**
 * Candidate Application Schema
 */
export const candidateApplicationSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(50),
    last_name: z.string().min(1, 'Last name is required').max(50),
    email: emailSchema,
    phone: phoneSchema,

    job_id: uuidSchema,

    current_company: z.string().max(100).optional().or(z.literal('')),
    current_designation: z.string().max(100).optional().or(z.literal('')),

    experience_years: z.number().min(0).max(50),
    current_ctc: z.number().min(0).optional(),
    expected_ctc: z.number().min(0),

    notice_period_days: z.number().min(0).max(180),

    resume_file: z.instanceof(File).refine(
        (file) => file.size <= 5 * 1024 * 1024,
        { message: 'Resume must be less than 5MB' }
    ).refine(
        (file) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
        { message: 'Resume must be PDF or Word document' }
    ).optional(),

    cover_letter: z.string().max(2000).optional().or(z.literal('')),
})

export type CandidateApplicationFormData = z.infer<typeof candidateApplicationSchema>

// ============================================================================
// Performance Schemas
// ============================================================================

/**
 * OKR/KRA Schema
 */
export const objectiveSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
    category: z.enum(['individual', 'team', 'organization']),
    start_date: dateStringSchema,
    end_date: dateStringSchema,
    weight: z.number().min(0).max(100).default(0),
    target_value: z.number().min(0).optional(),
    unit: z.string().max(20).optional().or(z.literal('')),
}).refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    {
        message: 'End date must be on or after start date',
        path: ['end_date'],
    }
)

export type ObjectiveFormData = z.infer<typeof objectiveSchema>

/**
 * Performance Review Self-Rating Schema
 */
export const selfRatingSchema = z.object({
    kra_id: uuidSchema,
    self_rating: z.number().min(1).max(5),
    self_comments: z.string().min(10, 'Comments must be at least 10 characters').max(1000),
    achievements: z.string().max(2000).optional().or(z.literal('')),
})

export type SelfRatingFormData = z.infer<typeof selfRatingSchema>

// ============================================================================
// Workflow Schemas
// ============================================================================

/**
 * Approval Action Schema
 */
export const approvalActionSchema = z.object({
    action: z.enum(['approve', 'reject', 'delegate']),
    comments: z.string()
        .min(5, 'Comments must be at least 5 characters')
        .max(500)
        .optional()
        .or(z.literal('')),
    delegate_to: uuidSchema.optional(),
}).refine(
    (data) => {
        if (data.action === 'reject') {
            return data.comments && data.comments.length >= 5
        }
        return true
    },
    {
        message: 'Comments are required when rejecting',
        path: ['comments'],
    }
).refine(
    (data) => {
        if (data.action === 'delegate') {
            return data.delegate_to && data.delegate_to.length > 0
        }
        return true
    },
    {
        message: 'Delegate target is required when delegating',
        path: ['delegate_to'],
    }
)

export type ApprovalActionFormData = z.infer<typeof approvalActionSchema>

// ============================================================================
// Asset Schemas
// ============================================================================

/**
 * Asset Assignment Schema
 */
export const assetAssignmentSchema = z.object({
    asset_id: uuidSchema,
    employee_id: uuidSchema,
    assigned_date: dateStringSchema,
    expected_return_date: optionalDateSchema,
    notes: z.string().max(500).optional().or(z.literal('')),
}).refine(
    (data) => {
        if (data.expected_return_date) {
            return new Date(data.expected_return_date) >= new Date(data.assigned_date)
        }
        return true
    },
    {
        message: 'Expected return date must be on or after assigned date',
        path: ['expected_return_date'],
    }
)

export type AssetAssignmentFormData = z.infer<typeof assetAssignmentSchema>

// ============================================================================
// Auth Schemas
// ============================================================================

/**
 * Login Schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric').optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
}).refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
})

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
    email: emailSchema,
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely parse form data with schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function safeParseForm<T extends z.ZodSchema>(
    schema: T,
    data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        if (!errors[path]) {
            errors[path] = issue.message
        }
    }

    return { success: false, errors }
}

/**
 * Transform Zod errors to react-hook-form format
 */
export function zodErrorsToFormErrors(
    zodError: z.ZodError
): Record<string, { message: string }> {
    const errors: Record<string, { message: string }> = {}
    for (const issue of zodError.issues) {
        const path = issue.path.join('.')
        if (!errors[path]) {
            errors[path] = { message: issue.message }
        }
    }
    return errors
}
