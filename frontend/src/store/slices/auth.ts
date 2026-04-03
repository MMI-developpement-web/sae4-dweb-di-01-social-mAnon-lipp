/**
 * Auth State Slice
 * Manages user authentication, tokens, and auth-related actions
 */

import { useState, useCallback } from 'react';
import type { User } from '../types';
import { fetchCurrentUser } from '../../lib/api';

export interface AuthState {
  currentUser: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
}

export interface AuthActions {
  setCurrentUser: (user: User, token: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  initializeAuth: (token?: string) => Promise<void>;
}

export type AuthSlice = AuthState & AuthActions;

export const useAuthSlice = (
  onAuthCleared?: () => void,
  onError?: (key: string, message: string) => void
): AuthSlice => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const setCurrentUser = useCallback((user: User, token: string) => {
    setCurrentUserState(user);
    setAuthTokenState(token);
    localStorage.setItem('auth_token', token);
  }, []);

  const updateCurrentUser = useCallback((updates: Partial<User>) => {
    setCurrentUserState((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const clearAuth = useCallback(() => {
    setCurrentUserState(null);
    setAuthTokenState(null);
    localStorage.removeItem('auth_token');
    onAuthCleared?.();
  }, [onAuthCleared]);

  const initializeAuth = useCallback(
    async (token?: string) => {
      setIsAuthLoading(true);
      try {
        const tokenToUse = token || localStorage.getItem('auth_token');
        if (!tokenToUse) {
          setIsAuthLoading(false);
          return;
        }

        const user = await fetchCurrentUser();
        setCurrentUser(user, tokenToUse);
      } catch (error) {
        clearAuth();
        const message = error instanceof Error ? error.message : 'Failed to initialize auth';
        onError?.('auth', message);
        throw error;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [setCurrentUser, clearAuth, onError]
  );

  return {
    currentUser,
    authToken,
    isAuthLoading,
    setCurrentUser,
    updateCurrentUser,
    clearAuth,
    initializeAuth,
  };
};
