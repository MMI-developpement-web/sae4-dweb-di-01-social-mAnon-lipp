/**
 * Shared Types — used across multiple API modules
 */

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

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
}

/**
 * Internal type used by fetchCurrentUser to map API response
 * (API returns 'banner' but we normalize to 'bannerPicture')
 */
export interface RawCurrentUserResponse extends User {
  banner?: string;
}
