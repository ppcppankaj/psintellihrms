import React from 'react'

interface MaintenanceFallbackProps {
    message?: string
    onRetry?: () => void
}

const MaintenanceFallback: React.FC<MaintenanceFallbackProps> = ({ message, onRetry }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-yellow-50">
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
                    <svg
                        className="w-6 h-6 text-yellow-600 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </div>

                <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">Service unavailable</h3>

                <p className="mt-2 text-sm text-gray-500 text-center">
                    {message || 'Our backend is down or under maintenance. Please try again shortly.'}
                </p>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 transition"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => onRetry?.()}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 text-sm font-medium rounded hover:bg-gray-300 transition"
                    >
                        Retry check
                    </button>
                </div>

                <p className="mt-4 text-xs text-gray-500 text-center">
                    If this persists, contact support with the time of occurrence.
                </p>
            </div>
        </div>
    )
}

export default MaintenanceFallback
