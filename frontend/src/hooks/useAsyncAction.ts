/**
 * Custom hook for managing async operations with loading and error states
 * 
 * Simplifies the common pattern of:
 * - Show loading indicator
 * - Execute async function
 * - Catch and display errors
 * - Reset loading state on completion
 * 
 * Usage:
 * const { isLoading, error, execute } = useAsyncAction();
 * await execute(async () => {
 *   await apiCall();
 *   onSuccess();
 * });
 */

import { useState } from 'react';

export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute an async function with automatic loading/error handling
   * 
   * @param asyncFn The async function to execute
   * @param onError Optional callback to handle errors
   */
  const execute = async (
    asyncFn: () => Promise<void>,
    onError?: (err: any) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await asyncFn();
    } catch (err: any) {
      const message = err?.message || 'Une erreur est survenue';
      setError(message);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, execute };
}
