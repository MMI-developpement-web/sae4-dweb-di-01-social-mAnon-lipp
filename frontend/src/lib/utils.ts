import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Build a complete image URL from a relative path
 * Handles both relative paths (/uploads/...) and absolute URLs (http://...)
 */
export function getImageUrl(path?: string): string | undefined {
  if (!path) return undefined;
  
  // Already an absolute URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // Relative path - prepend API base URL
  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
  const baseUrl = apiBase.replace("/api", ""); // Remove /api to get base URL
  return baseUrl + path;
}
