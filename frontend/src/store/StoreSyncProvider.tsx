/**
 * Store Sync Provider
 * 
 * This component synchronizes the AuthContext with the Store.
 * When the user logs in/out, this component automatically updates the Store
 * to keep it in sync with the authentication state.
 * 
 * Must be placed inside both AuthProvider and StoreProvider.
 */

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from './StoreContext';
import type { User } from './types';

export const StoreSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser: authUser } = useAuth();
  const { currentUser: storeCurrentUser, setCurrentUser, clearAuth: clearStoreAuth } = useStore();
  
  useEffect(() => {
    if (authUser) {
      // User is now logged in (either just logged in or we have a valid token)
      const token = localStorage.getItem('auth_token');
      
      // Only update Store if user has changed or token exists but Store is empty
      if (token && storeCurrentUser?.id !== authUser.id) {
        // Cast to Store User type (handles potential type differences)
        setCurrentUser(authUser as User, token);
      }
    } else {
      // User is logged out
      if (storeCurrentUser) {
        clearStoreAuth();
      }
    }
  }, [authUser, storeCurrentUser, setCurrentUser, clearStoreAuth]);
  
  return <>{children}</>;
};
