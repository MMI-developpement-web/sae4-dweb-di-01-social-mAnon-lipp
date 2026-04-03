/**
 * Tweets API — CRUD, likes, pins, search
 */

import { apiFetch, apiFetchFormData } from "./base";
import type { Pagination } from "./types";

// Tweet-related types
export interface TweetAuthor {
  id: number;
  username: string;
  profilePicture?: string;
  readOnly?: boolean;
}

export interface Retweet {
  id: number;
  content?: string;
  author: TweetAuthor;
  createdAt: string;
  originalTweetId?: number;
}

export interface RetweetDisplay extends Retweet {
  type: "retweet";
  originalTweet: Tweet;
}

export interface Tweet {
  id: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author: TweetAuthor;
  likeCount?: number;
  isLiked?: boolean;
  isPinned?: boolean;
  retweetCount?: number;
  userRetweet?: Retweet;
  medias?: Array<{
    url: string;
    type: "image" | "video";
    mimeType: string;
  }>;
  replies?: Reply[];
}

export interface Reply {
  id: number;
  content: string;
  author: TweetAuthor;
  createdAt: string;
  medias?: Array<{
    url: string;
    type: "image" | "video";
    mimeType: string;
  }>;
}

export interface TweetsResponse {
  tweets: Tweet[];
  retweets: RetweetDisplay[];
  pagination: Pagination;
}

export interface SearchFilters {
  q?: string;
  user?: string;
  startDate?: string;
  searchType?: "all" | "tweets" | "users" | "hashtag";
}

/**
 * Fetch tweets with pagination
 * GET /api/tweets?page=1&per_page=20
 */
export async function fetchTweets(page: number, perPage = 20): Promise<TweetsResponse> {
  return apiFetch<TweetsResponse>(`/tweets?page=${page}&per_page=${perPage}`);
}

/**
 * Fetch a single tweet by ID
 * GET /api/tweets/:id
 */
export async function fetchTweetById(tweetId: number): Promise<Tweet> {
  return apiFetch<Tweet>(`/tweets/${tweetId}`);
}

/**
 * Search tweets in the feed
 * GET /api/tweets/search?q=&user=&startDate=&page=&per_page=
 */
export async function searchTweets(
  page: number,
  perPage = 20,
  filters: SearchFilters = {}
): Promise<TweetsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (filters.q) params.append("q", filters.q);
  if (filters.user) params.append("user", filters.user);
  if (filters.startDate) params.append("startDate", filters.startDate);

  return apiFetch<TweetsResponse>(`/tweets/search?${params.toString()}`);
}

/**
 * Post a tweet (text only)
 * POST /api/tweets
 * Sends JSON with 'content'
 */
export async function postTweet(content: string): Promise<Tweet> {
  return apiFetch<Tweet>("/tweets", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

/**
 * Create a tweet (text only)
 * POST /api/tweets
 * Sends JSON with 'content'
 */
export async function createTweet(content: string): Promise<Tweet> {
  return apiFetch<Tweet>("/tweets", {
    method: "POST",
    body: JSON.stringify({ content: content.trim() }),
  });
}

/**
 * Post a tweet with media files
 * POST /api/tweets
 * Sends FormData with 'content' and optional 'media[]' files
 */
export async function postTweetWithMedia(formData: FormData): Promise<Tweet> {
  return apiFetchFormData<Tweet>("/tweets", {
    method: "POST",
    body: formData,
  });
}

/**
 * Delete a tweet
 * DELETE /api/tweets/:id
 */
export async function deleteTweet(tweetId: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/tweets/${tweetId}`, {
    method: "DELETE",
  });
}

/**
 * Update a tweet
 * PUT /api/tweets/:id
 */
export async function updateTweet(tweetId: number, content: string, medias?: any[]): Promise<Tweet> {
  return apiFetch<Tweet>(`/tweets/${tweetId}`, {
    method: "PUT",
    body: JSON.stringify({ content, medias }),
  });
}

/**
 * Like a tweet
 * POST /api/tweets/:id/like
 */
export async function likeTweet(
  tweetId: number
): Promise<{ message: string; likeCount: number }> {
  return apiFetch<{ message: string; likeCount: number }>(`/tweets/${tweetId}/like`, {
    method: "POST",
  });
}

/**
 * Unlike a tweet
 * DELETE /api/tweets/:id/like
 */
export async function unlikeTweet(
  tweetId: number
): Promise<{ message: string; likeCount: number }> {
  return apiFetch<{ message: string; likeCount: number }>(`/tweets/${tweetId}/like`, {
    method: "DELETE",
  });
}

/**
 * Pin a tweet to user's profile
 * POST /api/tweets/:id/pin
 */
export async function pinTweet(tweetId: number): Promise<Tweet> {
  return apiFetch<Tweet>(`/tweets/${tweetId}/pin`, {
    method: "POST",
  });
}

/**
 * Unpin a tweet from user's profile
 * POST /api/tweets/:id/unpin
 */
export async function unpinTweet(tweetId: number): Promise<Tweet> {
  return apiFetch<Tweet>(`/tweets/${tweetId}/unpin`, {
    method: "POST",
  });
}
