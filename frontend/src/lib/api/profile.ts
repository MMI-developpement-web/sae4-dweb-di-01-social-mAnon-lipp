/**
 * Profile API — update user profile and settings
 */

import { apiFetch, apiFetchFormData } from "./base";
import type { User } from "./types";

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
  bannerPicture?: File
): Promise<UpdateProfileResponse> {
  // If there are files to upload, use FormData
  if (profilePicture || bannerPicture) {
    const formData = new FormData();

    // Append text fields (trimmed, but always included to ensure proper FormData structure)
    if (data.bio !== undefined) formData.append("bio", data.bio.trim());
    if (data.website !== undefined) formData.append("website", data.website.trim());
    if (data.location !== undefined) formData.append("location", data.location.trim());

    // Append file uploads
    if (profilePicture) formData.append("profilePicture", profilePicture);
    if (bannerPicture) formData.append("bannerPicture", bannerPicture);

    return apiFetchFormData<UpdateProfileResponse>(`/users/${userId}`, {
      method: "PUT",
      body: formData,
    });
  }

  // Otherwise, send as JSON (only include non-empty values)
  const normalizedData: UpdateProfileRequest = {};
  if (data.bio !== undefined && data.bio.trim()) normalizedData.bio = data.bio.trim();
  if (data.website !== undefined && data.website.trim())
    normalizedData.website = data.website.trim();
  if (data.location !== undefined && data.location.trim())
    normalizedData.location = data.location.trim();

  return apiFetch<UpdateProfileResponse>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(normalizedData),
  });
}

/**
 * Update user's read-only setting
 * PATCH /api/users/:id/read-only
 */
export async function updateReadOnly(
  userId: number,
  readOnly: boolean
): Promise<{ readOnly: boolean; message: string }> {
  return apiFetch<{ readOnly: boolean; message: string }>(`/users/${userId}/read-only`, {
    method: "PATCH",
    body: JSON.stringify({ readOnly }),
  });
}
