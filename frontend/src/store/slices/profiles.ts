/**
 * User Profiles State Slice
 * Manages cached user profiles and profile-related actions
 */

import { useState, useCallback } from 'react';
import type { UserProfile } from '../types';
import { apiFetch } from '../../lib/api';

export interface ProfilesState {
  userProfiles: Map<number, UserProfile>;
}

export interface ProfilesActions {
  setUserProfile: (profile: UserProfile) => void;
  fetchUserProfile: (userId: number) => Promise<UserProfile>;
  fetchUserTweets: (userId: number) => Promise<any[]>;
}

export type ProfilesSlice = ProfilesState & ProfilesActions;

export const useProfilesSlice = (
  onError?: (key: string, message: string) => void,
  onClearError?: (key: string) => void
): ProfilesSlice => {
  const [userProfiles, setUserProfiles] = useState<Map<number, UserProfile>>(new Map());

  const setUserProfile = useCallback((profile: UserProfile) => {
    setUserProfiles((prev) => {
      const next = new Map(prev);
      next.set(profile.id, profile);
      return next;
    });
  }, []);

  const fetchUserProfile = useCallback(
    async (userId: number): Promise<UserProfile> => {
      try {
        const profile = await apiFetch<UserProfile>(`/users/${userId}`);
        setUserProfile(profile);
        onClearError?.('profile');
        return profile;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile';
        onError?.('profile', message);
        throw err;
      }
    },
    [setUserProfile, onError, onClearError]
  );

  const fetchUserTweets = useCallback(async (userId: number): Promise<any[]> => {
    try {
      const response = await apiFetch<{
        data: any[];
        pagination: { page: number; per_page: number; total: number };
      }>(`/users/${userId}/tweets?page=1&per_page=50`);

      onClearError?.('userTweets');
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user tweets';
      onError?.('userTweets', message);
      throw err;
    }
  }, [onError, onClearError]);

  return {
    userProfiles,
    setUserProfile,
    fetchUserProfile,
    fetchUserTweets,
  };
};
