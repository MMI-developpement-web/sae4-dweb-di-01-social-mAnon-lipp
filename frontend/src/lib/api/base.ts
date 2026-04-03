/**
 * API Client Base — Core fetch functions with Bearer token handling
 */

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

/**
 * Check if we should redirect to login (common to both fetch functions)
 */
function handleAuthError() {
  if (
    !window.location.pathname.startsWith("/login") &&
    !window.location.pathname.startsWith("/register")
  ) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
}

/**
 * Parse error response (common to both fetch functions)
 */
async function parseErrorResponse(res: Response): Promise<any> {
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
  errorData.status = res.status;
  return errorData;
}

/**
 * Core fetch implementation with token handling
 * @param path API path
 * @param options Fetch options
 * @param includeContentType Whether to set Content-Type: application/json
 */
async function apiFetchCore<T>(
  path: string,
  options?: RequestInit,
  includeContentType: boolean = true
): Promise<T> {
  const token = localStorage.getItem("auth_token");

  // Build headers: defaults → token → user options
  const headers: HeadersInit = {
    ...(includeContentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };

  const fetchOpts: RequestInit = {
    cache: "no-store",
    ...options,
    headers,
  };

  const res = await fetch(`${API_BASE}${path}`, fetchOpts);

  if (res.status === 401) {
    handleAuthError();
  }

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch with JSON
 * Automatically adds Bearer token from localStorage
 * Handles 401 redirects to /login
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return apiFetchCore<T>(path, options, true);
}

/**
 * Fetch with FormData (for file uploads)
 * Doesn't set Content-Type header — browser sets it automatically with boundary
 * Automatically adds Bearer token from localStorage
 */
export async function apiFetchFormData<T>(path: string, options?: RequestInit): Promise<T> {
  return apiFetchCore<T>(path, options, false);
}
