/**
 * UI State Slice
 * Manages loading states and UI-related state
 */

import { useState, useCallback } from 'react';

export interface UIState {
  isLoadingFeed: boolean;
  isLoadingProfile: boolean;
  feedPage: number;
}

export interface UIActions {
  setFeedLoading: (loading: boolean) => void;
  setProfileLoading: (loading: boolean) => void;
  setFeedPage: (page: number) => void;
}

export type UISlice = UIState & UIActions;

export const useUISlice = (): UISlice => {
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [feedPage, setFeedPage] = useState(1);

  const handleSetFeedLoading = useCallback((loading: boolean) => {
    setIsLoadingFeed(loading);
  }, []);

  const handleSetProfileLoading = useCallback((loading: boolean) => {
    setIsLoadingProfile(loading);
  }, []);

  const handleSetFeedPage = useCallback((page: number) => {
    setFeedPage(page);
  }, []);

  return {
    isLoadingFeed,
    isLoadingProfile,
    feedPage,
    setFeedLoading: handleSetFeedLoading,
    setProfileLoading: handleSetProfileLoading,
    setFeedPage: handleSetFeedPage,
  };
};
