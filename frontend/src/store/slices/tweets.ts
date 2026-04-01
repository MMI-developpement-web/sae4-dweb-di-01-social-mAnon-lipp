/**
 * Tweets State Slice
 * Manages tweet cache, feed state, and tweet-related actions
 */

import { useState, useCallback } from 'react';
import type { Tweet, User } from '../types';
import { apiFetch, updateTweet as apiUpdateTweet } from '../../lib/api';

export interface TweetsState {
  tweets: Map<number, Tweet>;
  tweetOrder: number[];
}

export interface TweetsActions {
  addTweet: (tweet: Tweet) => void;
  removeTweet: (tweetId: number) => void;
  updateTweet: (tweetId: number, updates: Partial<Tweet>) => void;
  fetchFeedTweets: (page: number) => Promise<Tweet[]>;
  createTweet: (currentUser: User | null, content: string) => Promise<Tweet>;
  deleteTweet: (tweetId: number) => Promise<void>;
  modifyTweet: (tweetId: number, content: string, medias?: any[]) => Promise<Tweet>;
}

export type TweetsSlice = TweetsState & TweetsActions;

export const useTweetsSlice = (
  onError?: (key: string, message: string) => void,
  onClearError?: (key: string) => void,
  onSetFeedPage?: (page: number) => void
): TweetsSlice => {
  const [tweets, setTweets] = useState<Map<number, Tweet>>(new Map());
  const [tweetOrder, setTweetOrder] = useState<number[]>([]);

  const addTweet = useCallback((tweet: Tweet) => {
    setTweets((prev) => {
      const next = new Map(prev);
      const existing = prev.get(tweet.id);

      // If tweet exists, merge with preserved local state (isPinned)
      if (existing) {
        next.set(tweet.id, {
          ...tweet,
          isPinned: existing.isPinned,
        });
      } else {
        next.set(tweet.id, tweet);
      }

      return next;
    });
  }, []);

  const removeTweet = useCallback((tweetId: number) => {
    setTweets((prev) => {
      const next = new Map(prev);
      next.delete(tweetId);
      return next;
    });
    setTweetOrder((prev) => prev.filter((id) => id !== tweetId));
  }, []);

  const updateTweet = useCallback((tweetId: number, updates: Partial<Tweet>) => {
    setTweets((prev) => {
      const tweet = prev.get(tweetId);
      const next = new Map(prev);

      if (tweet) {
        next.set(tweetId, { ...tweet, ...updates });
      } else {
        next.set(tweetId, updates as Tweet);
      }

      return next;
    });
  }, []);

  const fetchFeedTweets = useCallback(
    async (page: number): Promise<Tweet[]> => {
      try {
        const response = await apiFetch<{
          data: Tweet[];
          pagination: { page: number; per_page: number; total: number };
        }>(`/tweets?page=${page}&per_page=20`);

        const newTweets = response.data;
        newTweets.forEach((tweet) => addTweet(tweet));

        // Append to tweet order, avoiding duplicates
        setTweetOrder((prev) => {
          const newIds = newTweets.map((t) => t.id).filter((id) => !prev.includes(id));
          return [...prev, ...newIds];
        });

        onSetFeedPage?.(page);
        onClearError?.('feed');
        return newTweets;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load feed';
        onError?.('feed', message);
        throw err;
      }
    },
    [addTweet, onError, onClearError, onSetFeedPage]
  );

  const createTweet = useCallback(
    async (currentUser: User | null, content: string): Promise<Tweet> => {
      if (!currentUser) throw new Error('Not authenticated');

      try {
        const tweet = await apiFetch<Tweet>('/tweets', {
          method: 'POST',
          body: JSON.stringify({ content }),
        });

        addTweet(tweet);
        setTweetOrder((prev) => [tweet.id, ...prev]);
        onClearError?.('createTweet');
        return tweet;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create tweet';
        onError?.('createTweet', message);
        throw err;
      }
    },
    [addTweet, onError, onClearError]
  );

  const deleteTweet = useCallback(
    async (tweetId: number) => {
      try {
        await apiFetch(`/tweets/${tweetId}`, { method: 'DELETE' });
        removeTweet(tweetId);
        onClearError?.('deleteTweet');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete tweet';
        onError?.('deleteTweet', message);
        throw err;
      }
    },
    [removeTweet, onError, onClearError]
  );

  const modifyTweet = useCallback(
    async (tweetId: number, content: string, medias?: any[]) => {
      try {
        const updatedTweet = await apiUpdateTweet(tweetId, content, medias);
        updateTweet(tweetId, updatedTweet);
        onClearError?.('modifyTweet');
        return updatedTweet;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tweet';
        onError?.('modifyTweet', message);
        throw err;
      }
    },
    [updateTweet, onError, onClearError]
  );

  return {
    tweets,
    tweetOrder,
    addTweet,
    removeTweet,
    updateTweet,
    fetchFeedTweets,
    createTweet,
    deleteTweet,
    modifyTweet,
  };
};
