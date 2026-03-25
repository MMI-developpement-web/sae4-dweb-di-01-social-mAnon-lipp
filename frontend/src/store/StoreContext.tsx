/**
 * Store Context — Global state management via React Context
 * 
 * The StoreProvider component wraps the entire app and manages:
 * - User authentication state
 * - Tweet cache and feed data
 * - Like/follow relationships
 * - Error handling
 * 
 * Use the useStore() hook in any component to access state and actions.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Tweet, UserProfile, StoreContextType } from './types';
import { apiFetch, fetchCurrentUser, updateProfile as apiUpdateProfile } from '../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Create Context
// ─────────────────────────────────────────────────────────────────────────────

const StoreContext = createContext<StoreContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────────────────

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ─── Auth State ──────────────────────────────────────────────────────────
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // ─── Tweets State ───────────────────────────────────────────────────────
  const [tweets, setTweets] = useState<Map<number, Tweet>>(new Map());
  const [tweetOrder, setTweetOrder] = useState<number[]>([]);
  
  // ─── Profile State ──────────────────────────────────────────────────────
  const [userProfiles, setUserProfiles] = useState<Map<number, UserProfile>>(new Map());
  
  // ─── Relationships State ────────────────────────────────────────────────
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());
  const [likedTweets, setLikedTweets] = useState<Set<number>>(new Set());
  
  // ─── UI State ───────────────────────────────────────────────────────────
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  
  // ─── Error State ────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  
  // ═════════════════════════════════════════════════════════════════════════
  // INITIALIZATION: Auth from localStorage at startup
  // ═════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        setCurrentUserState(user);
        setAuthToken(token);
      } catch (error) {
        // If token is invalid, clear it
        localStorage.removeItem('auth_token');
        setCurrentUserState(null);
        setAuthToken(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes in localStorage (e.g., new login in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (e.newValue) {
          // Token was set - reload
          initializeAuth();
        } else {
          // Token was removed - clear auth
          setCurrentUserState(null);
          setAuthToken(null);
          setTweets(new Map());
          setTweetOrder([]);
          setUserProfiles(new Map());
          setFollowingUsers(new Set());
          setLikedTweets(new Set());
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
  // ACTIONS: Error Handling (declare first, used by other actions)
  // ═════════════════════════════════════════════════════════════════════════
  
  const setError = useCallback((key: string, message: string) => {
    setErrors((prev) => ({ ...prev, [key]: message }));
  }, []);
  
  const clearError = useCallback((key: string) => {
    setErrors((prev) => ({ ...prev, [key]: null }));
  }, []);
  
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  // ═════════════════════════════════════════════════════════════════════════
  // ACTIONS: Auth
  // ═════════════════════════════════════════════════════════════════════════
  
  const setCurrentUser = useCallback((user: User, token: string) => {
    setCurrentUserState(user);
    setAuthToken(token);
    localStorage.setItem('auth_token', token);
    // Clear liked/following sets to populate with fresh data
    setLikedTweets(new Set());
    setFollowingUsers(new Set());
  }, []);
  
  const clearAuth = useCallback(() => {
    setCurrentUserState(null);
    setAuthToken(null);
    localStorage.removeItem('auth_token');
    // Clear all user-specific data
    setTweets(new Map());
    setTweetOrder([]);
    setUserProfiles(new Map());
    setFollowingUsers(new Set());
    setLikedTweets(new Set());
    setErrors({});
  }, []);
  
  const initializeAuth = useCallback(async (token: string) => {
    setIsAuthLoading(true);
    try {
      const user = await apiFetch<User>('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCurrentUser(user, token);
    } catch (err) {
      clearAuth();
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  }, [setCurrentUser, clearAuth]);
  
  // ═════════════════════════════════════════════════════════════════════════
  // ACTIONS: Tweets
  // ═════════════════════════════════════════════════════════════════════════
  
  const addTweet = useCallback((tweet: Tweet) => {
    setTweets((prev) => {
      const next = new Map(prev);
      next.set(tweet.id, tweet);
      return next;
    });
  }, []);
  
  const removeTweet = useCallback((tweetId: number) => {
    setTweets((prev) => {
      const next = new Map(prev);
      next.delete(tweetId);
      return next;
    });
    setTweetOrder((prev) => prev.filter((id) => id !== tweetId));
  }, []);
  
  const updateTweet = useCallback((tweetId: number, updates: Partial<Tweet>) => {
    setTweets((prev) => {
      const tweet = prev.get(tweetId);
      const next = new Map(prev);
      
      if (tweet) {
        // Merge with existing tweet
        next.set(tweetId, { ...tweet, ...updates });
      } else {
        // If tweet doesn't exist in cache, add it (e.g., after modifying a tweet not in store)
        next.set(tweetId, updates as Tweet);
      }
      
      return next;
    });
  }, []);
  
  const fetchFeedTweets = useCallback(async (page: number) => {
    setIsLoadingFeed(true);
    try {
      const response = await apiFetch<{
        data: Tweet[];
        pagination: { page: number; per_page: number; total: number };
      }>(`/tweets?page=${page}&per_page=20`);
      
      const newTweets = response.data;
      newTweets.forEach((tweet) => addTweet(tweet));
      
      // Append to tweet order, avoiding duplicates
      setTweetOrder((prev) => {
        const newIds = newTweets.map((t) => t.id).filter((id) => !prev.includes(id));
        return [...prev, ...newIds];
      });
      
      setFeedPage(page);
      clearError('feed');
      return newTweets;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load feed';
      setError('feed', message);
      throw err;
    } finally {
      setIsLoadingFeed(false);
    }
  }, [addTweet, clearError, setError]);
  
  const createTweet = useCallback(
    async (content: string) => {
      if (!currentUser) throw new Error('Not authenticated');
      
      try {
        const tweet = await apiFetch<Tweet>('/tweets', {
          method: 'POST',
          body: JSON.stringify({ content }),
        });
        
        addTweet(tweet);
        // Add to front of feed
        setTweetOrder((prev) => [tweet.id, ...prev]);
        clearError('createTweet');
        return tweet;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create tweet';
        setError('createTweet', message);
        throw err;
      }
    },
    [currentUser, addTweet, clearError, setError]
  );
  
  const deleteTweet = useCallback(async (tweetId: number) => {
    try {
      await apiFetch(`/tweets/${tweetId}`, { method: 'DELETE' });
      removeTweet(tweetId);
      clearError('deleteTweet');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tweet';
      setError('deleteTweet', message);
      throw err;
    }
  }, [removeTweet, clearError, setError]);

  const modifyTweet = useCallback(
    async (tweetId: number, content: string, medias?: any[]) => {
      if (!currentUser) throw new Error('Not authenticated');
      
      try {
        const { updateTweet: apiUpdateTweet } = await import('../lib/api');
        const updatedTweet = await apiUpdateTweet(tweetId, content, medias);
        updateTweet(tweetId, updatedTweet);
        clearError('modifyTweet');
        return updatedTweet;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tweet';
        setError('modifyTweet', message);
        throw err;
      }
    },
    [currentUser, updateTweet, clearError, setError]
  );
  
  // ═════════════════════════════════════════════════════════════════════════
  // ACTIONS: Likes
  // ═════════════════════════════════════════════════════════════════════════
  
  const likeTweet = useCallback(
    async (tweetId: number) => {
      if (!currentUser) throw new Error('Not authenticated');
      
      // Optimistic update
      const wasLiked = likedTweets.has(tweetId);
      setLikedTweets((prev) => new Set(prev).add(tweetId));
      
      const tweet = tweets.get(tweetId);
      if (tweet) {
        updateTweet(tweetId, { likeCount: (tweet.likeCount ?? 0) + 1 });
      }
      
      try {
        await apiFetch(`/tweets/${tweetId}/like`, { method: 'POST' });
        clearError('likeTweet');
      } catch (err) {
        // Revert optimistic update
        if (!wasLiked) {
          setLikedTweets((prev) => {
            const next = new Set(prev);
            next.delete(tweetId);
            return next;
          });
        }
        if (tweet) {
          updateTweet(tweetId, { likeCount: tweet.likeCount });
        }
        
        const message = err instanceof Error ? err.message : 'Failed to like tweet';
        setError('likeTweet', message);
        throw err;
      }
    },
    [currentUser, likedTweets, tweets, updateTweet, clearError, setError]
  );
  
  const unlikeTweet = useCallback(
    async (tweetId: number) => {
      if (!currentUser) throw new Error('Not authenticated');
      
      // Optimistic update
      const wasLiked = likedTweets.has(tweetId);
      setLikedTweets((prev) => {
        const next = new Set(prev);
        next.delete(tweetId);
        return next;
      });
      
      const tweet = tweets.get(tweetId);
      if (tweet) {
        updateTweet(tweetId, { likeCount: Math.max(0, (tweet.likeCount ?? 0) - 1) });
      }
      
      try {
        await apiFetch(`/tweets/${tweetId}/like`, { method: 'DELETE' });
        clearError('unlikeTweet');
      } catch (err) {
        // Revert optimistic update
        if (wasLiked) {
          setLikedTweets((prev) => new Set(prev).add(tweetId));
        }
        if (tweet) {
          updateTweet(tweetId, { likeCount: tweet.likeCount });
        }
        
        const message = err instanceof Error ? err.message : 'Failed to unlike tweet';
        setError('unlikeTweet', message);
        throw err;
      }
    },
    [currentUser, likedTweets, tweets, updateTweet, clearError, setError]
  );
  
  const isLiked = useCallback((tweetId: number) => {
    return likedTweets.has(tweetId);
  }, [likedTweets]);
  
  const initializeLikes = useCallback((tweets: Tweet[]) => {
    const liked = new Set<number>();
    tweets.forEach((tweet) => {
      if (tweet.isLiked) {
        liked.add(tweet.id);
      }
    });
    setLikedTweets(liked);
  }, []);
  
  // ═════════════════════════════════════════════════════════════════════════
  // ACTIONS: Profiles
  // ═════════════════════════════════════════════════════════════════════════
  
  const setUserProfile = useCallback((profile: UserProfile) => {
    setUserProfiles((prev) => {
      const next = new Map(prev);
      next.set(profile.id, profile);
      return next;
    });
  }, []);
  
  const fetchUserProfile = useCallback(async (userId: number) => {
    setIsLoadingProfile(true);
    try {
      const profile = await apiFetch<UserProfile>(`/users/${userId}`);
      setUserProfile(profile);
      clearError('profile');
      return profile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError('profile', message);
      throw err;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [setUserProfile, clearError, setError]);
  
  const fetchUserTweets = useCallback(
    async (userId: number) => {
      try {
        const response = await apiFetch<{
          data: Tweet[];
          pagination: { page: number; per_page: number; total: number };
        }>(`/users/${userId}/tweets?page=1&per_page=50`);
        
        response.data.forEach((tweet) => addTweet(tweet));
        clearError('userTweets');
        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load user tweets';
        setError('userTweets', message);
        throw err;
      }
    },
    [addTweet, clearError, setError]
  );
  
  // ═════════════════════════════════════════════════════════════════════════
  // ACTIONS: Follow
  // ═════════════════════════════════════════════════════════════════════════
  
  const followUser = useCallback(
    async (userId: number) => {
      if (!currentUser) throw new Error('Not authenticated');
      
      // Optimistic update
      const wasFollowing = followingUsers.has(userId);
      setFollowingUsers((prev) => new Set(prev).add(userId));
      
      const profile = userProfiles.get(userId);
      if (profile) {
        setUserProfile({
          ...profile,
          followerCount: profile.followerCount + 1,
          isFollowing: true,
        });
      }
      
      try {
        await apiFetch(`/users/${userId}/follow`, { method: 'POST' });
        clearError('followUser');
      } catch (err) {
        // Revert optimistic update
        if (!wasFollowing) {
          setFollowingUsers((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }
        if (profile) {
          setUserProfile({
            ...profile,
            followerCount: profile.followerCount,
            isFollowing: false,
          });
        }
        
        const message = err instanceof Error ? err.message : 'Failed to follow user';
        setError('followUser', message);
        throw err;
      }
    },
    [currentUser, followingUsers, userProfiles, setUserProfile, clearError, setError]
  );
  
  const unfollowUser = useCallback(
    async (userId: number) => {
      if (!currentUser) throw new Error('Not authenticated');
      
      // Optimistic update
      const wasFollowing = followingUsers.has(userId);
      setFollowingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      
      const profile = userProfiles.get(userId);
      if (profile) {
        setUserProfile({
          ...profile,
          followerCount: Math.max(0, profile.followerCount - 1),
          isFollowing: false,
        });
      }
      
      try {
        await apiFetch(`/users/${userId}/follow`, { method: 'DELETE' });
        clearError('unfollowUser');
      } catch (err) {
        // Revert optimistic update
        if (wasFollowing) {
          setFollowingUsers((prev) => new Set(prev).add(userId));
        }
        if (profile) {
          setUserProfile({
            ...profile,
            followerCount: profile.followerCount,
            isFollowing: true,
          });
        }
        
        const message = err instanceof Error ? err.message : 'Failed to unfollow user';
        setError('unfollowUser', message);
        throw err;
      }
    },
    [currentUser, followingUsers, userProfiles, setUserProfile, clearError, setError]
  );
  
  const isFollowing = useCallback((userId: number) => {
    return followingUsers.has(userId);
  }, [followingUsers]);
  
  // ═════════════════════════════════════════════════════════════════════════
  // ACTIONS: Update Current User Profile
  // ═════════════════════════════════════════════════════════════════════════
  
  const updateProfile = useCallback(
    async (bio?: string, website?: string, location?: string, profilePicture?: File, bannerPicture?: File): Promise<User> => {
      if (!currentUser) throw new Error('Not authenticated');
      
      try {
        const response = await apiUpdateProfile(
          currentUser.id,
          { bio, website, location },
          profilePicture,
          bannerPicture,
        );
        
        // Update current user in state
        const updatedUser = response.user;
        setCurrentUserState(updatedUser);
        
        // Update profile in cache if this user's profile is cached
        const cachedProfile = userProfiles.get(currentUser.id);
        if (cachedProfile) {
          setUserProfile({
            ...cachedProfile,
            bio: updatedUser.bio,
            website: updatedUser.website,
            location: updatedUser.location,
            profilePicture: updatedUser.profilePicture,
            bannerPicture: updatedUser.bannerPicture,
          });
        }
        
        clearError('updateProfile');
        return updatedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setError('updateProfile', message);
        throw err;
      }
    },
    [currentUser, userProfiles, setUserProfile, clearError, setError]
  );
  
  // ═════════════════════════════════════════════════════════════════════════
  // ACTIONS: UI State
  // ═════════════════════════════════════════════════════════════════════════
  
  const setFeedLoading = useCallback((loading: boolean) => {
    setIsLoadingFeed(loading);
  }, []);
  
  const setProfileLoading = useCallback((loading: boolean) => {
    setIsLoadingProfile(loading);
  }, []);
  
  const value: StoreContextType = {
    // State
    currentUser,
    authToken,
    isAuthLoading,
    tweets,
    tweetOrder,
    userProfiles,
    followingUsers,
    likedTweets,
    isLoadingFeed,
    isLoadingProfile,
    feedPage,
    errors,
    
    // Actions
    setCurrentUser,
    clearAuth,
    initializeAuth,
    addTweet,
    removeTweet,
    updateTweet,
    fetchFeedTweets,
    createTweet,
    deleteTweet,
    modifyTweet,
    likeTweet,
    unlikeTweet,
    isLiked,
    initializeLikes,
    setUserProfile,
    fetchUserProfile,
    fetchUserTweets,
    updateProfile,
    followUser,
    unfollowUser,
    isFollowing,
    setError,
    clearError,
    clearAllErrors,
    setFeedLoading,
    setProfileLoading,
    setFeedPage,
  };
  
  return (
    <StoreContext.Provider value={value}>
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
