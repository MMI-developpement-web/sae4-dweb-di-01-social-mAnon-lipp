import { useState, useEffect } from "react";
import { followUser, unfollowUser, type UserProfile } from "../lib/api";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";

interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile: boolean;
  onFollowChange?: () => Promise<void>;
}

export default function ProfileHeader({
  user,
  isOwnProfile,
  onFollowChange,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state when user data changes from API
  useEffect(() => {
    setIsFollowing(user.isFollowing);
  }, [user.id, user.isFollowing]);

  const handleFollowClick = async () => {
    setIsLoading(true);
    try {
      const response = isFollowing
        ? await unfollowUser(user.id)
        : await followUser(user.id);
      
      // Update state from API response
      setIsFollowing(response.isFollowing);
      
      // Refresh profile data
      if (onFollowChange) {
        await onFollowChange();
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article className="px-5 py-5">
      {/* Avatar + Name/Bio + Location/Website */}
      <div className="flex gap-4 mb-6">
        <div className="-mt-24 relative z-10">
          <Avatar
            src={user.profilePicture}
            alt={user.username}
            size="lg"
            className="rounded-lg border-4 border-background"
          />
        </div>
        <div className="flex-1 pt-2">
          <h1 className="text-xl font-bold text-tweet-author">
            {user.username}
          </h1>
          {user.bio && (
            <p className="text-text-muted text-sm mt-1">{user.bio}</p>
          )}

          {/* Location & Website */}
          <div className="space-y-2 text-sm text-tweet-author mt-3">
            {user.location && (
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{user.location}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tweet-author hover:underline"
                >
                  {user.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow Button */}
      {!isOwnProfile && (
        <Button
          onClick={handleFollowClick}
          disabled={isLoading}
          variant={isFollowing ? "outline" : "primary"}
          size="sm"
          className="w-fit"
        >
          {isLoading ? "..." : isFollowing ? "Ne plus suivre" : "S'abonner"}
        </Button>
      )}
    </article>
  );
}
