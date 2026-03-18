const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}${path}`, {
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
      errorData = await res.json();
    } catch {
      const text = await res.text();
      errorData = { error: text };
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
  
  // Redirect to login page
  window.location.href = "/login";
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
  author: TweetAuthor;
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
  banner?: string;
  location?: string;
  website?: string;
}

export interface TweetsResponse {
  tweets: Tweet[];
  pagination: Pagination;
}

export interface ProfileResponse {
  user: User;
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
 * Fetch current user profile
 * GET /api/me
 */
export async function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>("/me");
}

/**
 * Fetch user profile with tweets
 * GET /api/users/:id
 */
export async function fetchUserProfile(userId: number, page = 1, perPage = 20): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>(`/users/${userId}?page=${page}&per_page=${perPage}`);
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

