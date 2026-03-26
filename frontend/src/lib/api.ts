const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401 && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  if (!res.ok) {
    let errorData;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        errorData = await res.json();
      } else {
        const text = await res.text();
        errorData = { error: text || `HTTP ${res.status}` };
      }
    } catch (e) {
      errorData = { error: `HTTP ${res.status}` };
    }
    // Include status code in error object
    errorData.status = res.status;
    throw errorData;
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch with FormData (for file uploads) — doesn't set Content-Type header
 * The browser will set it automatically with the boundary
 */
export async function apiFetchFormData<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const authHeaders: HeadersInit = {};
  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
  }
  
  // Properly merge headers to avoid overwriting auth header
  const mergedHeaders = {
    ...authHeaders,
    ...(options?.headers || {}),
  };
  
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers: mergedHeaders,
  });
  if (res.status === 401 && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  if (!res.ok) {
    let errorData;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        errorData = await res.json();
      } else {
        const text = await res.text();
        errorData = { error: text || `HTTP ${res.status}` };
      }
    } catch (e) {
      errorData = { error: `HTTP ${res.status}` };
    }
    throw errorData;
  }
  return res.json() as Promise<T>;
}

// Auth API endpoints
export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    username: string;
  };
}

/**
 * Logout the current user
 * Clears the auth token from localStorage and redirects to login
 */
export async function logout(): Promise<void> {
  
  try {
    // Call the logout endpoint on the server
    await apiFetch("/logout", { method: "POST" });
  } catch (error) {
    console.error("Logout error:", error);
    // Continue with logout even if the server call fails
  }
  
  // Clear the token from localStorage
  localStorage.removeItem("auth_token");
  window.dispatchEvent(new Event("authTokenChanged"));
}


export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Tweet API
export interface TweetAuthor {
  id: number;
  username: string;
  profilePicture?: string;
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
  medias?: Array<{
    url: string;
    type: 'image' | 'video';
    mimeType: string;
  }>;
  replies?: Reply[];
}

export interface Reply {
  id: number;
  content: string;
  author: TweetAuthor;
  createdAt: string;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  bannerPicture?: string;
  location?: string;
  website?: string;
  readOnly?: boolean;
}

interface RawCurrentUserResponse extends User {
  banner?: string;
}

export interface TweetsResponse {
  tweets: Tweet[];
  pagination: Pagination;
}

export async function fetchTweets(page: number, perPage = 20): Promise<TweetsResponse> {
  return apiFetch<TweetsResponse>(`/tweets?page=${page}&per_page=${perPage}`);
}

export async function postTweet(content: string): Promise<Tweet> {
  return apiFetch<Tweet>("/tweets", {
    method: "POST",
    body: JSON.stringify({ content }),
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
 * Fetch current user profile
 * GET /api/me
 */
export async function fetchCurrentUser(): Promise<User> {
  const user = await apiFetch<RawCurrentUserResponse>("/me");

  return {
    ...user,
    bannerPicture: user.bannerPicture ?? user.banner,
  };
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
export async function likeTweet(tweetId: number): Promise<{ message: string; likeCount: number }> {
  return apiFetch<{ message: string; likeCount: number }>(`/tweets/${tweetId}/like`, {
    method: "POST",
  });
}

/**
 * Unlike a tweet
 * DELETE /api/tweets/:id/like
 */
export async function unlikeTweet(tweetId: number): Promise<{ message: string; likeCount: number }> {
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
 * POST /api/tweets/:id/unpin or DELETE /api/tweets/:id/pin
 */
export async function unpinTweet(tweetId: number): Promise<Tweet> {
  return apiFetch<Tweet>(`/tweets/${tweetId}/unpin`, {
    method: "POST",
  });
}

// Follow API
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

export interface FollowResponse {
  message: string;
  isFollowing: boolean;
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
 * Fetch user's tweets
 * GET /api/users/:id/tweets?page=1&per_page=20
 */
export async function fetchUserTweets(userId: number, page = 1, perPage = 20): Promise<TweetsResponse> {
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

// Block API

export interface BlockResponse {
  message: string;
  isBlocked: boolean;
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

// Profile Update API

export interface UpdateProfileRequest {
  bio?: string;
  website?: string;
  location?: string;
}

export interface UpdateProfileResponse {
  user: User;
  message: string;
}

/**
 * Update user profile
 * PUT /api/users/:id
 * Supports both JSON payload and multipart form data with file uploads
 */
export async function updateProfile(
  userId: number,
  data: UpdateProfileRequest,
  profilePicture?: File,
  bannerPicture?: File,
): Promise<UpdateProfileResponse> {
  // If there are files to upload, use FormData
  if (profilePicture || bannerPicture) {
    const formData = new FormData();
    
    // Append text fields (trimmed, but always included to ensure proper FormData structure)
    if (data.bio !== undefined) formData.append('bio', data.bio.trim());
    if (data.website !== undefined) formData.append('website', data.website.trim());
    if (data.location !== undefined) formData.append('location', data.location.trim());
    
    // Append file uploads
    if (profilePicture) formData.append('profilePicture', profilePicture);
    if (bannerPicture) formData.append('bannerPicture', bannerPicture);
    
    
    return apiFetchFormData<UpdateProfileResponse>(`/users/${userId}`, {
      method: "PUT",
      body: formData,
    });
  }
  
  // Otherwise, send as JSON (only include non-empty values)
  const normalizedData: UpdateProfileRequest = {};
  if (data.bio !== undefined && data.bio.trim()) normalizedData.bio = data.bio.trim();
  if (data.website !== undefined && data.website.trim()) normalizedData.website = data.website.trim();
  if (data.location !== undefined && data.location.trim()) normalizedData.location = data.location.trim();
  
  console.log('🔍 DEBUG updateProfile (JSON)', { normalizedData });
  
  return apiFetch<UpdateProfileResponse>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(normalizedData),
  });
}

/**
 * Update user's read-only setting
 * PATCH /api/users/:id/read-only
 */
export async function updateReadOnly(userId: number, readOnly: boolean): Promise<{ readOnly: boolean; message: string }> {
  return apiFetch<{ readOnly: boolean; message: string }>(`/users/${userId}/read-only`, {
    method: "PATCH",
    body: JSON.stringify({ readOnly }),
  });
}

// Reply API

/**
 * Create a reply to a tweet
 * POST /api/tweets/:tweetId/replies
 */
export async function createReply(tweetId: number, content: string): Promise<Reply> {
  return apiFetch<Reply>(`/tweets/${tweetId}/replies`, {
    method: "POST",
    body: JSON.stringify({ tweetId, content }),
  });
}

/**
 * Delete a reply
 * DELETE /api/replies/:replyId
 */
export async function deleteReply(replyId: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/replies/${replyId}`, {
    method: "DELETE",
  });
}



