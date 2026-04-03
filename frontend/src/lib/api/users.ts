/**
 * Users API — profiles, follow, block, search
 */

import { apiFetch } from "./base";
import type { TweetsResponse } from "./tweets";

// User profile types
export interface UserProfile {
  id: number;
  email: string;
  username: string;
  bio?: string;
  profilePicture?: string;
  bannerPicture?: string;
  location?: string;
  website?: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  readOnly?: boolean;
}

export interface UserProfileResponse {
  user: UserProfile;
}

export interface UserSearchResponse {
  users: UserProfile[];
}

export interface FollowResponse {
  message: string;
  isFollowing: boolean;
}

export interface BlockResponse {
  message: string;
  isBlocked: boolean;
}

/**
 * Fetch user profile by ID
 * GET /api/users/:id
 */
export async function fetchUserProfile(userId: number): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>(`/users/${userId}`);
}

/**
 * Fetch user profile by username
 * GET /api/users/by-username/:username
 */
export async function fetchUserByUsername(username: string): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>(`/users/by-username/${username}`);
}

/**
 * Search users by partial username
 * GET /api/users/search?q=
 */
export async function searchUsers(query: string): Promise<UserSearchResponse> {
  const params = new URLSearchParams();
  params.append("q", query);
  return apiFetch<UserSearchResponse>(`/users/search?${params.toString()}`);
}

/**
 * Fetch user's tweets
 * GET /api/users/:id/tweets?page=1&per_page=20
 */
export async function fetchUserTweets(
  userId: number,
  page = 1,
  perPage = 20
): Promise<TweetsResponse> {
  return apiFetch<TweetsResponse>(`/users/${userId}/tweets?page=${page}&per_page=${perPage}`);
}

/**
 * Fetch blocked users of current user
 * GET /api/users/{id}/blocked
 */
export async function fetchBlockedUsers(userId: number): Promise<{ users: UserProfile[] }> {
  return apiFetch<{ users: UserProfile[] }>(`/users/${userId}/blocked`);
}

/**
 * Follow a user
 * POST /api/users/:id/follow
 */
export async function followUser(userId: number): Promise<FollowResponse> {
  return apiFetch<FollowResponse>(`/users/${userId}/follow`, {
    method: "POST",
  });
}

/**
 * Unfollow a user
 * DELETE /api/users/:id/follow
 */
export async function unfollowUser(userId: number): Promise<FollowResponse> {
  return apiFetch<FollowResponse>(`/users/${userId}/follow`, {
    method: "DELETE",
  });
}

/**
 * Block a user
 * POST /api/users/:id/block
 */
export async function blockUser(userId: number): Promise<BlockResponse> {
  return apiFetch<BlockResponse>(`/users/${userId}/block`, {
    method: "POST",
  });
}

/**
 * Unblock a user
 * DELETE /api/users/:id/block
 */
export async function unblockUser(userId: number): Promise<BlockResponse> {
  return apiFetch<BlockResponse>(`/users/${userId}/block`, {
    method: "DELETE",
  });
}
