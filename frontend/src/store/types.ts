/**
 * Store Types — Centralized state management for the social network app
 * 
 * This file defines:
 * - AppState: The shape of the app's global state
 * - StoreActions: All actions to modify state
 * - StoreContextType: Combines state + actions for the context
 */

import type { User as ApiUser, UserProfile as ApiUserProfile } from '../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Re-export and extend types from API
// ─────────────────────────────────────────────────────────────────────────────

export type User = ApiUser;
export type UserProfile = ApiUserProfile;

export interface Reply {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    profilePicture?: string;
    readOnly?: boolean;
  };
  createdAt: string;
}

export interface Retweet {
  id: number;
  originalTweetId?: number;
  author: {
    id: number;
    username: string;
    profilePicture?: string;
    readOnly?: boolean;
  };
  content?: string;
  createdAt: string;
  originalTweet?: Tweet;
}

export interface Tweet {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    profilePicture?: string;
    readOnly?: boolean;
  };
  likeCount?: number;
  createdAt: string;
  updatedAt?: string;
  isLiked?: boolean;
  isPinned?: boolean;
  retweetCount?: number;
  userRetweet?: Retweet;
  medias?: Array<{
    url: string;
    type: 'image' | 'video';
    mimeType: string;
  }>;
  replies?: Reply[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Global App State
// ─────────────────────────────────────────────────────────────────────────────

export interface AppState {
  // Authentication
  currentUser: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  
  // Tweets
  tweets: Map<number, Tweet>;        // Cache all loaded tweets by ID
  tweetOrder: number[];              // Order of tweet IDs for feed
  
  // User Profiles
  userProfiles: Map<number, UserProfile>;  // Cache profiles by user ID
  
  // Relationships
  followingUsers: Set<number>;        // IDs of users the current user follows
  likedTweets: Set<number>;           // IDs of tweets liked by current user
  blockedUsers: Set<number>;          // IDs of users the current user has blocked
  retweetedTweets: Map<number, number>;  // Map of tweetId -> retweetId for tweets retweeted by current user
  
  // UI State
  isLoadingFeed: boolean;
  isLoadingProfile: boolean;
  feedPage: number;
  
  // Error tracking
  errors: Record<string, string | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Actions
// ─────────────────────────────────────────────────────────────────────────────

export interface StoreActions {
  // ─── Auth actions ───────────────────────────────────────────────────────
  
  /**
   * Set the current authenticated user and token
   */
  setCurrentUser: (user: User, token: string) => void;
  
  /**
   * Update specific fields of the current user
   */
  updateCurrentUser: (updates: Partial<User>) => void;
  
  /**
   * Clear auth state (logout)
   */
  clearAuth: () => void;
  
  /**
   * Initialize user from localStorage token
   */
  initializeAuth: (token: string) => Promise<void>;
  
  // ─── Tweet actions ──────────────────────────────────────────────────────
  
  /**
   * Add or update a tweet in the store
   */
  addTweet: (tweet: Tweet) => void;
  
  /**
   * Remove a tweet from local cache
   */
  removeTweet: (tweetId: number) => void;
  
  /**
   * Update tweet data (e.g., like count after server response)
   */
  updateTweet: (tweetId: number, updates: Partial<Tweet>) => void;
  
  /**
   * Fetch tweets for the feed from API
   */
  fetchFeedTweets: (page: number) => Promise<Tweet[]>;
  
  /**
   * Post a new tweet
   */
  createTweet: (content: string) => Promise<Tweet>;
  
  /**
   * Delete a tweet from server and local cache
   */
  deleteTweet: (tweetId: number) => Promise<void>;

  /**
   * Update a tweet content on the server
   */
  modifyTweet: (tweetId: number, content: string, medias?: any[]) => Promise<Tweet>;
  
  // ─── Like actions ──────────────────────────────────────────────────────
  
  /**
   * Like a tweet (optimistic update + server sync)
   */
  likeTweet: (tweetId: number) => Promise<void>;
  
  /**
   * Unlike a tweet (optimistic update + server sync)
   */
  unlikeTweet: (tweetId: number) => Promise<void>;
  
  /**
   * Check if current user has liked a tweet
   */
  isLiked: (tweetId: number) => boolean;
  
  /**
   * Initialize liked tweets from a list of tweets (used when loading feeds)
   * Populates the likedTweets Set with tweet IDs where isLiked=true
   */
  initializeLikes: (tweets: Tweet[]) => void;
  
  // ─── Pin actions ────────────────────────────────────────────────────────
  
  /**
   * Pin a tweet to user's profile (only one pinned tweet per user)
   */
  pinTweet: (tweetId: number) => Promise<Tweet>;
  
  /**
   * Unpin a tweet from user's profile
   */
  unpinTweet: (tweetId: number) => Promise<Tweet>;

  // ─── Retweet actions ───────────────────────────────────────────────────

  /**
   * Retweet a tweet (with optional comment)
   */
  retweetTweet: (tweetId: number, content?: string) => Promise<Retweet>;
  
  /**
   * Delete a retweet
   */
  deleteRetweet: (retweetId: number) => Promise<void>;
  
  /**
   * Check if current user has retweeted a tweet
   */
  hasRetweeted: (tweetId: number) => boolean;
  
  /**
   * Initialize retweets from a list of tweets (used when loading feeds)
   * Populates the retweetedTweets Map with tweet IDs where userRetweet is set
   */
  initializeRetweets: (tweets: Tweet[]) => void;
  
  // ─── Profile actions ───────────────────────────────────────────────────
  
  /**
   * Fetch a user's profile and their tweets
   */
  fetchUserProfile: (userId: number) => Promise<UserProfile>;
  
  /**
   * Add/update a profile in cache
   */
  setUserProfile: (profile: UserProfile) => void;
  
  /**
   * Update current user profile (for own user)
   */
  updateProfile: (bio?: string, website?: string, location?: string, profilePicture?: File, bannerPicture?: File) => Promise<User>;
  
  /**
   * Fetch tweets for a specific user
   */
  fetchUserTweets: (userId: number) => Promise<Tweet[]>;
  
  // ─── Follow actions ────────────────────────────────────────────────────
  
  /**
   * Follow a user (optimistic update + server sync)
   */
  followUser: (userId: number) => Promise<void>;
  
  /**
   * Unfollow a user (optimistic update + server sync)
   */
  unfollowUser: (userId: number) => Promise<void>;
  
  /**
   * Check if current user follows a user
   */
  isFollowing: (userId: number) => boolean;

  /**
   * Block a user from following and interacting
   */
  blockUser: (userId: number) => Promise<void>;

  /**
   * Unblock a user
   */
  unblockUser: (userId: number) => Promise<void>;

  /**
   * Check if current user has blocked a user
   */
  isBlocked: (userId: number) => boolean;
  
  // ─── Error handling ────────────────────────────────────────────────────
  
  /**
   * Set an error message for a specific action
   */
  setError: (key: string, message: string) => void;
  
  /**
   * Clear error for a specific key
   */
  clearError: (key: string) => void;
  
  /**
   * Clear all errors
   */
  clearAllErrors: () => void;
  
  // ─── UI state ──────────────────────────────────────────────────────────
  
  /**
   * Update loading state for feed
   */
  setFeedLoading: (loading: boolean) => void;
  
  /**
   * Update loading state for profile
   */
  setProfileLoading: (loading: boolean) => void;
  
  /**
   * Set current feed page
   */
  setFeedPage: (page: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Type (combines state + actions)
// ─────────────────────────────────────────────────────────────────────────────

export type StoreContextType = AppState & StoreActions;
