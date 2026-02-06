// User types
export interface User {
    id: string
    email: string
    first_name: string
    last_name: string
    full_name: string
    avatar?: string
    employee_id?: string
    is_verified: boolean
    is_2fa_enabled: boolean
    is_superuser?: boolean
    is_staff?: boolean
    is_org_admin?: boolean
    roles: string[]
    permissions: string[]
    organization?: Organization
}

// Auth types
export interface LoginCredentials {
    email: string
    password: string
    remember_me?: boolean
}

export interface AuthTokens {
    access: string
    refresh: string
}

export interface LoginResponse {
    user: User
    tokens: AuthTokens
    requires_2fa?: boolean
    session_id?: string
}

// Organization types
export interface Organization {
    id: string
    name: string
    slug: string
    logo?: string
    subscription_status: 'trial' | 'active' | 'suspended' | 'expired'
    features: Record<string, boolean>
}

export type Tenant = Organization

// Employee types
export interface Employee {
    id: string
    employee_id: string
    user: User
    department?: Department
    designation?: Designation
    location?: Location
    reporting_manager?: Employee
    date_of_joining: string
    employment_status: string
    is_active: boolean
}

export interface Department {
    id: string
    name: string
    code: string
    parent?: Department
}

export interface Designation {
    id: string
    name: string
    level: number
}

export interface Location {
    id: string
    name: string
    city: string
    country: string
}

// Attendance types
export interface AttendanceRecord {
    id: string
    employee: Employee
    date: string
    check_in?: string
    check_out?: string
    status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'wfh'
    total_hours?: number
    overtime_hours?: number
    late_minutes?: number
    is_flagged: boolean
}

export interface PunchRequest {
    latitude: number
    longitude: number
    accuracy?: number
    device_id?: string
    device_model?: string
    is_rooted?: boolean
    is_emulator?: boolean
    is_mock_gps?: boolean
}

export interface PunchResponse {
    success: boolean
    message: string
    fraud_score: number
    warnings: string[]
    attendance?: AttendanceRecord
}

// API types
export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

export interface PaginatedResponse<T> {
    count: number
    page?: number
    page_size?: number
    total_pages?: number
    next?: string | null
    previous?: string | null
    results: T[]
}

export interface ApiError {
    message: string
    code: string
    details?: Record<string, string[]>
}

// Menu types
export interface MenuItem {
    id: string
    label: string
    icon: string
    path: string
    permission?: string
    children?: MenuItem[]
    badge?: string | number
}
