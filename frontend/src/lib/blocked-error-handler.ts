/**
 * Blocked Error Handler — Common utility for handling 403 Blocked errors
 * 
 * When a user is blocked, API returns 403 status
 * This helper checks for that specific error case
 */

export interface BlockedErrorResult {
  isBlocked: boolean;
  message: string;
}

/**
 * Check if error is a 403 Blocked error
 * 
 * @param error The error to check
 * @returns Object with isBlocked flag and message
 */
export function handleBlockedError(error: any): BlockedErrorResult {
  if (error?.status === 403 || error?.response?.status === 403) {
    return {
      isBlocked: true,
      message: 'Vous avez été bloqué par cet utilisateur',
    };
  }

  return {
    isBlocked: false,
    message: '',
  };
}
