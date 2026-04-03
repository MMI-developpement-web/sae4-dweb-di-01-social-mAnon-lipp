/**
 * Authentication API — login, register, logout, current user
 */

import { apiFetch } from "./base";
import type { User, RawCurrentUserResponse } from "./types";

// Auth Request/Response types
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
 * Register a new user
 * POST /api/register
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Login with email and password
 * POST /api/login
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Logout the current user
 * Clears the auth token from localStorage and redirects to login
 * POST /api/logout
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
