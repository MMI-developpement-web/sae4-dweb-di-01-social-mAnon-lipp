/**
 * Store Context — Global state management via modular slices
 *
 * The StoreProvider combines multiple state slices:
 * - Auth (user, tokens)
 * - Tweets (cache, feed)
 * - Relationships (likes, follows, blocks, retweets)
 * - Profiles (user profiles cache)
 * - UI (loading states)
 * - Errors (error messages)
 *
 * Each slice is independent and can be composed together.
 * Use useStore() to access the complete store in any component.
 */

import React, { createContext, useContext, useEffect } from 'react';
import type { User, StoreContextType } from './types';
import { useAuthSlice } from './slices/auth';
import { useTweetsSlice } from './slices/tweets';
import { useRelationshipsSlice } from './slices/relationships';
import { useProfilesSlice } from './slices/profiles';
import { useUISlice } from './slices/ui';
import { useErrorSlice } from './slices/errors';
import { fetchBlockedUsers } from '../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Create Context
// ─────────────────────────────────────────────────────────────────────────────

const StoreContext = createContext<StoreContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────────────────

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Compose all slices
  const errorSlice = useErrorSlice();
  const uiSlice = useUISlice();
  const profilesSlice = useProfilesSlice(errorSlice.setError, errorSlice.clearError);
  const authSlice = useAuthSlice(
    () => {
      // On auth clear, reset all data
      tweetsSlice.tweetOrder.forEach((id) => tweetsSlice.removeTweet(id));
      profilesSlice.userProfiles.clear();
      relationshipsSlice.likedTweets.clear();
      relationshipsSlice.followingUsers.clear();
      relationshipsSlice.blockedUsers.clear();
      relationshipsSlice.retweetedTweets.clear();
      errorSlice.clearAllErrors();
    },
    errorSlice.setError
  );
  const tweetsSlice = useTweetsSlice(
    errorSlice.setError,
    errorSlice.clearError,
    uiSlice.setFeedPage
  );
  const relationshipsSlice = useRelationshipsSlice(
    errorSlice.setError,
    errorSlice.clearError,
    tweetsSlice.updateTweet,
    tweetsSlice.addTweet
  );
  
  // ═════════════════════════════════════════════════════════════════════════
  // INITIALIZATION: Auth from localStorage at startup
  // ═════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      try {
        await authSlice.initializeAuth(token);

        // Load blocked users for the current user
        if (authSlice.currentUser) {
          try {
            const blockedResponse = await fetchBlockedUsers(authSlice.currentUser.id);
            blockedResponse.users.forEach((profile) => {
              profilesSlice.setUserProfile(profile);
            });
            // Set blocked users in relationships slice
            blockedResponse.users.forEach((u) => {
              relationshipsSlice.blockUser(u.id, authSlice.currentUser);
            });
          } catch (error) {
            console.error('Error loading blocked users:', error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };

    initializeAuth();

    // Listen for changes in localStorage (e.g., new login in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (e.newValue) {
          initializeAuth();
        } else {
          authSlice.clearAuth();
        }
      }
    };

    // Listen for custom event (same-tab token changes, e.g., after login)
    const handleAuthTokenChanged = () => {
      initializeAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authTokenChanged', handleAuthTokenChanged);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authTokenChanged', handleAuthTokenChanged);
    };
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // Additional Actions: Profile Updates & Feed State
  // ═════════════════════════════════════════════════════════════════════════

  const updateProfile = async (
    bio?: string,
    website?: string,
    location?: string,
    profilePicture?: File,
    bannerPicture?: File
  ): Promise<User> => {
    if (!authSlice.currentUser) throw new Error('Not authenticated');

    try {
      const { updateProfile: apiUpdateProfile } = await import('../lib/api');
      const response = await apiUpdateProfile(
        authSlice.currentUser.id,
        { bio, website, location },
        profilePicture,
        bannerPicture
      );

      const updatedUser = response.user;
      authSlice.updateCurrentUser(updatedUser);

      // Update profile cache
      const cachedProfile = profilesSlice.userProfiles.get(authSlice.currentUser.id);
      if (cachedProfile) {
        profilesSlice.setUserProfile({
          ...cachedProfile,
          bio: updatedUser.bio,
          website: updatedUser.website,
          location: updatedUser.location,
          profilePicture: updatedUser.profilePicture,
          bannerPicture: updatedUser.bannerPicture,
        });
      }

      errorSlice.clearError('updateProfile');
      return updatedUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      errorSlice.setError('updateProfile', message);
      throw err;
    }
  };
  
  // ═════════════════════════════════════════════════════════════════════════
  // Combine all slices into final store value
  // ═════════════════════════════════════════════════════════════════════════

  const storeValue: StoreContextType = {
    // Auth
    currentUser: authSlice.currentUser,
    authToken: authSlice.authToken,
    isAuthLoading: authSlice.isAuthLoading,
    setCurrentUser: authSlice.setCurrentUser,
    updateCurrentUser: authSlice.updateCurrentUser,
    clearAuth: authSlice.clearAuth,
    initializeAuth: authSlice.initializeAuth,

    // Tweets
    tweets: tweetsSlice.tweets,
    tweetOrder: tweetsSlice.tweetOrder,
    addTweet: tweetsSlice.addTweet,
    removeTweet: tweetsSlice.removeTweet,
    updateTweet: tweetsSlice.updateTweet,
    fetchFeedTweets: tweetsSlice.fetchFeedTweets,
    createTweet: (content: string) => tweetsSlice.createTweet(authSlice.currentUser, content),
    deleteTweet: tweetsSlice.deleteTweet,
    modifyTweet: tweetsSlice.modifyTweet,

    // Likes
    likedTweets: relationshipsSlice.likedTweets,
    likeTweet: (tweetId: number) =>
      relationshipsSlice.likeTweet(tweetId, authSlice.currentUser, tweetsSlice.tweets.get(tweetId)),
    unlikeTweet: (tweetId: number) =>
      relationshipsSlice.unlikeTweet(tweetId, authSlice.currentUser, tweetsSlice.tweets.get(tweetId)),
    isLiked: relationshipsSlice.isLiked,
    initializeLikes: relationshipsSlice.initializeLikes,

    // Retweets
    retweetedTweets: relationshipsSlice.retweetedTweets,
    retweetTweet: (tweetId: number, content?: string) =>
      relationshipsSlice.retweetTweet(tweetId, authSlice.currentUser, content),
    deleteRetweet: (retweetId: number) =>
      relationshipsSlice.deleteRetweet(retweetId, authSlice.currentUser),
    hasRetweeted: relationshipsSlice.hasRetweeted,
    initializeRetweets: relationshipsSlice.initializeRetweets,

    // Pin/Unpin
    pinTweet: (tweetId: number) =>
      relationshipsSlice.pinTweet(tweetId, authSlice.currentUser, tweetsSlice.tweets),
    unpinTweet: (tweetId: number) =>
      relationshipsSlice.unpinTweet(tweetId, authSlice.currentUser),

    // Follows
    followingUsers: relationshipsSlice.followingUsers,
    followUser: (userId: number) => relationshipsSlice.followUser(userId, authSlice.currentUser),
    unfollowUser: (userId: number) => relationshipsSlice.unfollowUser(userId, authSlice.currentUser),
    isFollowing: relationshipsSlice.isFollowing,

    // Blocks
    blockedUsers: relationshipsSlice.blockedUsers,
    blockUser: (userId: number) => relationshipsSlice.blockUser(userId, authSlice.currentUser),
    unblockUser: (userId: number) => relationshipsSlice.unblockUser(userId, authSlice.currentUser),
    isBlocked: relationshipsSlice.isBlocked,

    // Profiles
    userProfiles: profilesSlice.userProfiles,
    setUserProfile: profilesSlice.setUserProfile,
    fetchUserProfile: profilesSlice.fetchUserProfile,
    fetchUserTweets: profilesSlice.fetchUserTweets,
    updateProfile,

    // UI
    isLoadingFeed: uiSlice.isLoadingFeed,
    isLoadingProfile: uiSlice.isLoadingProfile,
    feedPage: uiSlice.feedPage,
    setFeedLoading: uiSlice.setFeedLoading,
    setProfileLoading: uiSlice.setProfileLoading,
    setFeedPage: uiSlice.setFeedPage,

    // Errors
    errors: errorSlice.errors,
    setError: errorSlice.setError,
    clearError: errorSlice.clearError,
    clearAllErrors: errorSlice.clearAllErrors,
  };

  return (
    <StoreContext.Provider value={storeValue}>
      {children}
    </StoreContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// useStore Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook to access the global store from any component.
 * Must be used inside a <StoreProvider>.
 * 
 * @example
 * const { currentUser, tweets, addTweet } = useStore();
 */
export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used inside a <StoreProvider>');
  }
  return context;
};

/**
 * Hook to access only the current user from the store.
 * Prevents unnecessary re-renders when other store state changes.
 * 
 * @example
 * const currentUser = useCurrentUser();
 */
export const useCurrentUser = (): User | null => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useCurrentUser must be used inside a <StoreProvider>');
  }
  return store.currentUser;
};

/**
 * Hook to access only liked tweets from the store.
 * Prevents unnecessary re-renders when other store state changes.
 * 
 * @example
 * const isLiked = useIsLiked(tweetId);
 */
export const useIsLiked = (tweetId: number): boolean => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useIsLiked must be used inside a <StoreProvider>');
  }
  return store.likedTweets.has(tweetId);
};

export { StoreContext };
