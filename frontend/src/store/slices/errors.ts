/**
 * Error State Slice
 * Manages global error messages by key
 */

import { useState, useCallback } from 'react';

export interface ErrorState {
  errors: Record<string, string | null>;
}

export interface ErrorActions {
  setError: (key: string, message: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
}

export type ErrorSlice = ErrorState & ErrorActions;

export const useErrorSlice = (): ErrorSlice => {
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const setError = useCallback((key: string, message: string) => {
    setErrors((prev) => ({ ...prev, [key]: message }));
  }, []);

  const clearError = useCallback((key: string) => {
    setErrors((prev) => ({ ...prev, [key]: null }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
  };
};
