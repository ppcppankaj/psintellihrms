import React from 'react';

/**
 * Request Retry Logic with Exponential Backoff
 * 
 * Purpose: Automatically retry failed requests instead of showing errors
 * to user
 */

export class RequestRetryHelper {
  static async retryRequest(
    fn: () => Promise<any>,
    options: {
      maxRetries?: number;
      initialDelayMs?: number;
      maxDelayMs?: number;
      backoffMultiplier?: number;
      shouldRetry?: (error: any) => boolean;
    } = {}
  ): Promise<any> {
    const {
      maxRetries = 3,
      initialDelayMs = 1000,
      maxDelayMs = 10000,
      backoffMultiplier = 2,
      shouldRetry = (error) => this.isRetryableError(error),
    } = options;

    let lastError: any;
    let delay = initialDelayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !shouldRetry(error)) {
          throw error;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelayMs);
      }
    }

    throw lastError;
  }

  static isRetryableError(error: any): boolean {
    // Retry on network errors
    if (error.name === 'NetworkError' || error.message === 'Failed to fetch') {
      return true;
    }

    // Retry on timeout
    if (error.code === 'ECONNABORTED') {
      return true;
    }

    // Retry on 5xx errors (server errors)
    if (error.response?.status >= 500) {
      return true;
    }

    // Retry on 429 (rate limit)
    if (error.response?.status === 429) {
      return true;
    }

    // Don't retry on client errors (4xx except 429)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false;
    }

    return false;
  }
}

/**
 * Hook for retrying requests
 */
export const useRetryableRequest = () => {
  return (
    fn: () => Promise<any>,
    maxRetries: number = 3
  ) => {
    return RequestRetryHelper.retryRequest(fn, { maxRetries });
  };
};
