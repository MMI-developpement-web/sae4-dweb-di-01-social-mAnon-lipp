/**
 * Replies API — create and delete replies to tweets
 */

import { apiFetch, apiFetchFormData } from "./base";
import type { Reply } from "./tweets";

/**
 * Create a reply to a tweet
 * POST /api/tweets/:tweetId/replies
 */
export async function createReply(
  tweetId: number,
  content: string,
  mediaFiles?: File[]
): Promise<Reply> {
  // If media files provided, send as multipart/form-data
  if (mediaFiles && mediaFiles.length > 0) {
    const formData = new FormData();
    formData.append("content", content);
    // tweetId is part of URL, but keep for compatibility
    formData.append("tweetId", tweetId.toString());
    mediaFiles.forEach((file) => formData.append("media[]", file));
    return apiFetchFormData<Reply>(`/tweets/${tweetId}/replies`, {
      method: "POST",
      body: formData,
    });
  }

  // Otherwise send as JSON
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
