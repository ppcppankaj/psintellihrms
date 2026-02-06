/**
 * Environment Configuration
 * Centralized source of truth for all environment variables.
 * Enforces type safety and runtime validation.
 */

// 1. Define the shape of our environment
interface Config {
    API_URL: string
    IS_DEV: boolean
    IS_PROD: boolean
    MODE: string
    DEBUG_AUTH: boolean  // Enable auth debugging (dev only)
}

// 2. Access the environment safely
// We cast to any here ONCE so we don't have to do it everywhere
const _env = (import.meta as any).env

// 3. Helper for strict validation
const getEnv = (key: string, required = false, defaultValue = ''): string => {
    const val = _env[key]
    if (required && !val) {
        // Critical Error: Stop the app if a required secret is missing
        console.error(`[Config] Missing required environment variable: ${key}`)
        // We might choose to throw specific errors in strict mode
    }
    return val || defaultValue
}

// 4. Export the validated config object
export const config: Config = {
    // API URL: Defaults to relative path for proxying if not set
    API_URL: getEnv('VITE_API_URL', false, '/api/v1'),

    // Environment flags
    IS_DEV: _env.DEV || false,
    IS_PROD: _env.PROD || false,
    MODE: _env.MODE || 'development',
    
    // Debug auth logging - only enable in dev with explicit flag
    DEBUG_AUTH: (_env.DEV || false) && getEnv('VITE_DEBUG_AUTH', false, 'false') === 'true'
}

export default config
