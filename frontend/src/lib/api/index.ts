/**
 * API Client - Main export
 * Re-exports all API modules for a clean single-import interface
 *
 * Usage: import { fetchTweets, likeTweet, login } from "@/lib/api"
 */

// Base primitives
export { apiFetch, apiFetchFormData, API_BASE } from "./base";

// Shared types
export { type User, type Pagination } from "./types";

// Auth endpoints
export {
  type RegisterData,
  type LoginData,
  type AuthResponse,
  register,
  login,
  logout,
  fetchCurrentUser,
} from "./auth";

// Tweets endpoints
export {
  type TweetAuthor,
  type Retweet,
  type RetweetDisplay,
  type Tweet,
  type Reply,
  type TweetsResponse,
  type SearchFilters,
  fetchTweets,
  fetchTweetById,
  searchTweets,
  postTweet,
  createTweet,
  postTweetWithMedia,
  deleteTweet,
  updateTweet,
  likeTweet,
  unlikeTweet,
  pinTweet,
  unpinTweet,
} from "./tweets";

// Users endpoints
export {
  type UserProfile,
  type UserProfileResponse,
  type UserSearchResponse,
  type FollowResponse,
  type BlockResponse,
  fetchUserProfile,
  fetchUserByUsername,
  searchUsers,
  fetchUserTweets,
  fetchBlockedUsers,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
} from "./users";

// Profile endpoints
export {
  type UpdateProfileRequest,
  type UpdateProfileResponse,
  updateProfile,
  updateReadOnly,
} from "./profile";

// Replies endpoints
export { createReply, deleteReply } from "./replies";
