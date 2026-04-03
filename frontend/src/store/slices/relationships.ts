/**
 * Relationships State Slice
 * Manages likes, follows, blocks, and retweets
 */

import { useState, useCallback } from 'react';
import type { Tweet, Retweet, User } from '../types';
import {
  apiFetch,
  blockUser as apiBlockUser,
  unblockUser as apiUnblockUser,
  pinTweet as apiPinTweet,
  unpinTweet as apiUnpinTweet,
} from '../../lib/api';

export interface RelationshipsState {
  likedTweets: Set<number>;
  followingUsers: Set<number>;
  blockedUsers: Set<number>;
  retweetedTweets: Map<number, number>;
}

export interface RelationshipsActions {
  // Likes
  likeTweet: (tweetId: number, currentUser: User | null, tweet: Tweet | undefined) => Promise<void>;
  unlikeTweet: (tweetId: number, currentUser: User | null, tweet: Tweet | undefined) => Promise<void>;
  isLiked: (tweetId: number) => boolean;
  initializeLikes: (tweets: Tweet[]) => void;

  // Retweets
  retweetTweet: (tweetId: number, currentUser: User | null, content?: string) => Promise<Retweet>;
  deleteRetweet: (retweetId: number, currentUser: User | null) => Promise<void>;
  hasRetweeted: (tweetId: number) => boolean;
  initializeRetweets: (tweets: Tweet[]) => void;

  // Follows
  followUser: (userId: number, currentUser: User | null) => Promise<void>;
  unfollowUser: (userId: number, currentUser: User | null) => Promise<void>;
  isFollowing: (userId: number) => boolean;

  // Blocks
  blockUser: (userId: number, currentUser: User | null) => Promise<void>;
  unblockUser: (userId: number, currentUser: User | null) => Promise<void>;
  isBlocked: (userId: number) => boolean;

  // Pin/Unpin
  pinTweet: (tweetId: number, currentUser: User | null, tweets: Map<number, Tweet>) => Promise<Tweet>;
  unpinTweet: (tweetId: number, currentUser: User | null) => Promise<Tweet>;
}

export type RelationshipsSlice = RelationshipsState & RelationshipsActions;

export const useRelationshipsSlice = (
  onError?: (key: string, message: string) => void,
  onClearError?: (key: string) => void,
  onUpdateTweet?: (tweetId: number, updates: Partial<Tweet>) => void
): RelationshipsSlice => {
  const [likedTweets, setLikedTweets] = useState<Set<number>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<Set<number>>(new Set());
  const [retweetedTweets, setRetweetedTweets] = useState<Map<number, number>>(new Map());

  // ═══ LIKES ═══════════════════════════════════════════════════════════

  const likeTweet = useCallback(
    async (tweetId: number, currentUser: User | null, tweet: Tweet | undefined) => {
      if (!currentUser) throw new Error('Not authenticated');

      const wasLiked = likedTweets.has(tweetId);
      setLikedTweets((prev) => new Set(prev).add(tweetId));

      if (tweet) {
        onUpdateTweet?.(tweetId, { likeCount: (tweet.likeCount ?? 0) + 1 });
      }

      try {
        await apiFetch(`/tweets/${tweetId}/like`, { method: 'POST' });
        onClearError?.('likeTweet');
      } catch (err: any) {
        if (!wasLiked) {
          setLikedTweets((prev) => {
            const next = new Set(prev);
            next.delete(tweetId);
            return next;
          });
        }
        if (tweet) {
          onUpdateTweet?.(tweetId, { likeCount: tweet.likeCount });
        }

        if (err?.status !== 403) {
          const message = err instanceof Error ? err.message : 'Failed to like tweet';
          onError?.('likeTweet', message);
        }
        throw err;
      }
    },
    [likedTweets, onError, onClearError, onUpdateTweet]
  );

  const unlikeTweet = useCallback(
    async (tweetId: number, currentUser: User | null, tweet: Tweet | undefined) => {
      if (!currentUser) throw new Error('Not authenticated');

      const wasLiked = likedTweets.has(tweetId);
      setLikedTweets((prev) => {
        const next = new Set(prev);
        next.delete(tweetId);
        return next;
      });

      if (tweet) {
        onUpdateTweet?.(tweetId, { likeCount: Math.max(0, (tweet.likeCount ?? 0) - 1) });
      }

      try {
        await apiFetch(`/tweets/${tweetId}/like`, { method: 'DELETE' });
        onClearError?.('unlikeTweet');
      } catch (err: any) {
        if (wasLiked) {
          setLikedTweets((prev) => new Set(prev).add(tweetId));
        }
        if (tweet) {
          onUpdateTweet?.(tweetId, { likeCount: tweet.likeCount });
        }

        if (err?.status !== 403) {
          const message = err instanceof Error ? err.message : 'Failed to unlike tweet';
          onError?.('unlikeTweet', message);
        }
        throw err;
      }
    },
    [likedTweets, onError, onClearError, onUpdateTweet]
  );

  const isLiked = useCallback((tweetId: number) => {
    return likedTweets.has(tweetId);
  }, [likedTweets]);

  const initializeLikes = useCallback((tweets: Tweet[]) => {
    const liked = new Set<number>();
    tweets.forEach((tweet) => {
      if (tweet.isLiked) {
        liked.add(tweet.id);
      }
    });
    setLikedTweets(liked);
  }, []);

  // ═══ RETWEETS ═════════════════════════════════════════════════════════

  const retweetTweet = useCallback(
    async (tweetId: number, currentUser: User | null, content?: string): Promise<Retweet> => {
      if (!currentUser) throw new Error('Not authenticated');

      setRetweetedTweets((prev) => {
        const next = new Map(prev);
        next.set(tweetId, -1);
        return next;
      });

      try {
        const response = await apiFetch<{ retweet: Retweet; retweetCount: number }>(
          `/tweets/${tweetId}/retweet`,
          {
            method: 'POST',
            body: JSON.stringify({ content: content || null }),
          }
        );

        const { retweet, retweetCount } = response;

        setRetweetedTweets((prev) => {
          const next = new Map(prev);
          next.set(tweetId, retweet.id);
          return next;
        });

        onUpdateTweet?.(tweetId, {
          retweetCount: retweetCount,
          userRetweet: retweet,
        });

        onClearError?.('retweetTweet');
        return retweet;
      } catch (err) {
        setRetweetedTweets((prev) => {
          const next = new Map(prev);
          next.delete(tweetId);
          return next;
        });

        const message = err instanceof Error ? err.message : 'Failed to retweet';
        onError?.('retweetTweet', message);
        throw err;
      }
    },
    [onError, onClearError, onUpdateTweet]
  );

  const deleteRetweet = useCallback(
    async (retweetId: number, currentUser: User | null) => {
      if (!currentUser) throw new Error('Not authenticated');

      let tweetId: number | null = null;
      const retweetedEntry = Array.from(retweetedTweets.entries()).find(
        ([, id]) => id === retweetId
      );
      if (retweetedEntry) {
        tweetId = retweetedEntry[0];
      }

      if (tweetId !== null) {
        setRetweetedTweets((prev) => {
          const next = new Map(prev);
          next.delete(tweetId!);
          return next;
        });
      }

      try {
        const response = await apiFetch<{ tweetId: number; retweetCount: number }>(
          `/retweets/${retweetId}`,
          { method: 'DELETE' }
        );

        if (response.tweetId) {
          onUpdateTweet?.(response.tweetId, {
            retweetCount: response.retweetCount,
            userRetweet: undefined,
          });
        }

        onClearError?.('deleteRetweet');
      } catch (err) {
        if (tweetId !== null && retweetedEntry) {
          setRetweetedTweets((prev) => {
            const next = new Map(prev);
            next.set(tweetId, retweetId);
            return next;
          });
        }

        const message = err instanceof Error ? err.message : 'Failed to delete retweet';
        onError?.('deleteRetweet', message);
        throw err;
      }
    },
    [retweetedTweets, onError, onClearError, onUpdateTweet]
  );

  const hasRetweeted = useCallback((tweetId: number) => {
    return retweetedTweets.has(tweetId);
  }, [retweetedTweets]);

  const initializeRetweets = useCallback((tweets: Tweet[]) => {
    const retweeted = new Map<number, number>();
    tweets.forEach((tweet) => {
      if (tweet.userRetweet) {
        retweeted.set(tweet.id, tweet.userRetweet.id);
      }
    });
    setRetweetedTweets(retweeted);
  }, []);

  // ═══ FOLLOWS ════════════════════════════════════════════════════════

  const followUser = useCallback(
    async (userId: number, currentUser: User | null) => {
      if (!currentUser) throw new Error('Not authenticated');

      const wasFollowing = followingUsers.has(userId);
      setFollowingUsers((prev) => new Set(prev).add(userId));

      try {
        await apiFetch(`/users/${userId}/follow`, { method: 'POST' });
        onClearError?.('followUser');
      } catch (err) {
        if (!wasFollowing) {
          setFollowingUsers((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }

        const message = err instanceof Error ? err.message : 'Failed to follow user';
        onError?.('followUser', message);
        throw err;
      }
    },
    [followingUsers, onError, onClearError]
  );

  const unfollowUser = useCallback(
    async (userId: number, currentUser: User | null) => {
      if (!currentUser) throw new Error('Not authenticated');

      const wasFollowing = followingUsers.has(userId);
      setFollowingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

      try {
        await apiFetch(`/users/${userId}/follow`, { method: 'DELETE' });
        onClearError?.('unfollowUser');
      } catch (err) {
        if (wasFollowing) {
          setFollowingUsers((prev) => new Set(prev).add(userId));
        }

        const message = err instanceof Error ? err.message : 'Failed to unfollow user';
        onError?.('unfollowUser', message);
        throw err;
      }
    },
    [followingUsers, onError, onClearError]
  );

  const isFollowing = useCallback((userId: number) => {
    return followingUsers.has(userId);
  }, [followingUsers]);

  // ═══ BLOCKS ═════════════════════════════════════════════════════════

  const blockUser = useCallback(
    async (userId: number, currentUser: User | null) => {
      if (!currentUser) throw new Error('Not authenticated');

      const wasBlocked = blockedUsers.has(userId);
      setBlockedUsers((prev) => new Set(prev).add(userId));

      try {
        await apiBlockUser(userId);
        onClearError?.('blockUser');
      } catch (err) {
        if (!wasBlocked) {
          setBlockedUsers((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }

        const message = err instanceof Error ? err.message : 'Failed to block user';
        onError?.('blockUser', message);
        throw err;
      }
    },
    [blockedUsers, onError, onClearError]
  );

  const unblockUser = useCallback(
    async (userId: number, currentUser: User | null) => {
      if (!currentUser) throw new Error('Not authenticated');

      const wasBlocked = blockedUsers.has(userId);
      setBlockedUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

      try {
        await apiUnblockUser(userId);
        onClearError?.('unblockUser');
      } catch (err) {
        if (wasBlocked) {
          setBlockedUsers((prev) => new Set(prev).add(userId));
        }

        const message = err instanceof Error ? err.message : 'Failed to unblock user';
        onError?.('unblockUser', message);
        throw err;
      }
    },
    [blockedUsers, onError, onClearError]
  );

  const isBlocked = useCallback((userId: number) => {
    return blockedUsers.has(userId);
  }, [blockedUsers]);

  // ═══ PIN/UNPIN ════════════════════════════════════════════════════════

  const pinTweet = useCallback(
    async (tweetId: number, currentUser: User | null, tweets: Map<number, Tweet>) => {
      if (!currentUser) throw new Error('Not authenticated');

      const tweet = tweets.get(tweetId);
      if (!tweet) throw new Error('Tweet not found in store');

      onUpdateTweet?.(tweetId, { isPinned: true });

      try {
        const updatedTweet = await apiPinTweet(tweetId);
        onUpdateTweet?.(tweetId, updatedTweet);
        onClearError?.('pinTweet');
        return updatedTweet;
      } catch (err) {
        onUpdateTweet?.(tweetId, { isPinned: tweet.isPinned });
        const message = err instanceof Error ? err.message : 'Failed to pin tweet';
        onError?.('pinTweet', message);
        throw err;
      }
    },
    [onError, onClearError, onUpdateTweet]
  );

  const unpinTweet = useCallback(
    async (tweetId: number, currentUser: User | null) => {
      if (!currentUser) throw new Error('Not authenticated');

      try {
        const updatedTweet = await apiUnpinTweet(tweetId);
        onUpdateTweet?.(tweetId, updatedTweet);
        onClearError?.('unpinTweet');
        return updatedTweet;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to unpin tweet';
        onError?.('unpinTweet', message);
        throw err;
      }
    },
    [onError, onClearError, onUpdateTweet]
  );

  return {
    likedTweets,
    followingUsers,
    blockedUsers,
    retweetedTweets,
    likeTweet,
    unlikeTweet,
    isLiked,
    initializeLikes,
    retweetTweet,
    deleteRetweet,
    hasRetweeted,
    initializeRetweets,
    followUser,
    unfollowUser,
    isFollowing,
    blockUser,
    unblockUser,
    isBlocked,
    pinTweet,
    unpinTweet,
  };
};
