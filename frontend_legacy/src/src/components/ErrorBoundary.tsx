import React from 'react';

/**
 * Global Error Boundary Component
 * 
 * Purpose: Catch unhandled React errors and display user-friendly messages
 * instead of white screens.
 * 
 * Usage: Wrap entire app with <ErrorBoundary>...</ErrorBoundary>
 */

// Extend window type for error tracking service
declare global {
  interface Window {
    errorTrackingService?: {
      captureException: (error: Error, options?: { contexts?: { react?: React.ErrorInfo } }) => void;
    };
  }
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null, errorCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Log to error tracking service (Sentry, etc.)
    if (window.errorTrackingService) {
      window.errorTrackingService.captureException(error, { contexts: { react: errorInfo } });
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Auto-reset after 10 seconds if it's a transient error
    if (this.state.errorCount < 3) {
      setTimeout(() => this.resetError(), 10000);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-red-50">
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 4v2m0-12a9 9 0 110-18 9 9 0 010 18z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                Something went wrong
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                We're sorry for the inconvenience. The application encountered an unexpected error.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 font-mono overflow-auto max-h-32">
                  <p className="font-bold mb-1">Error Details:</p>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <p className="mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</p>
                  )}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={this.resetError}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 text-sm font-medium rounded hover:bg-gray-300 transition"
                >
                  Home
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center">
                Error #{this.state.errorCount}
                {this.state.errorCount >= 3 && (
                  <span className="block mt-1 text-red-600 font-semibold">
                    Please reload the page or contact support
                  </span>
                )}
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
