import React, { useState, useEffect } from 'react';

/**
 * Backend Down Handler Component
 * 
 * Purpose: Display graceful fallback when backend is completely unavailable
 * Replaces white screen of death with user-friendly message
 */

interface BackendDownHandlerProps {
  onRestore?: () => void;
}

export const BackendDownHandler: React.FC<BackendDownHandlerProps> = ({ onRestore }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [checkAttempts, setCheckAttempts] = useState(0);

  // Check backend connectivity periodically
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/health/', {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setIsOnline(true);
          onRestore?.();
          return;
        }
      } catch (error) {
        // Backend is down
      }
      
      setIsOnline(false);
      setCheckAttempts((prev) => prev + 1);
    };

    // Initial check
    checkBackendHealth();

    // If backend is down, check every 10 seconds
    if (!isOnline) {
      const interval = setInterval(checkBackendHealth, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, onRestore]);

  if (isOnline) return null;

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

        <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
          Service Maintenance
        </h3>

        <p className="mt-2 text-sm text-gray-500 text-center">
          The service is temporarily unavailable. We're working to restore it as quickly as possible.
        </p>

        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">
            <strong>Status:</strong> Maintenance in progress
          </p>
          <p className="text-xs text-gray-600 mt-1">
            <strong>Retry attempts:</strong> {checkAttempts}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            <strong>Next check:</strong> In 10 seconds...
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 transition"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              // Show status page
              window.location.href = '/status';
            }}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 text-sm font-medium rounded hover:bg-gray-300 transition"
          >
            Status
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          We appreciate your patience. Check our{' '}
          <a href="/status" className="text-blue-600 hover:underline">
            status page
          </a>{' '}
          for updates.
        </p>
      </div>
    </div>
  );
};

export default BackendDownHandler;
