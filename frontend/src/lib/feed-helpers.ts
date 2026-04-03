/**
 * Feed Helpers — Shared utilities for creating unified feeds
 * 
 * Used in both useFeed and useSearch hooks to consolidate
 * tweet and retweet data into a single sorted feed
 */

import type { TweetsResponse } from './api';

export interface FeedItem {
  type: 'tweet' | 'retweet';
  tweet: any;
  retweet?: any;
}

/**
 * Create a unified feed from tweets and retweets, sorted by date (descending)
 * 
 * @param response API response containing tweets and retweets
 * @returns Array of FeedItems sorted by creation date (newest first)
 */
export function createUnifiedFeed(response: TweetsResponse): FeedItem[] {
  const items: FeedItem[] = [];

  // Add tweets
  response.tweets.forEach((tweet) => {
    items.push({ type: 'tweet', tweet });
  });

  // Add retweets with their original tweets
  response.retweets.forEach((retweet) => {
    items.push({
      type: 'retweet',
      tweet: retweet.originalTweet,
      retweet: retweet,
    });
  });

  // Sort by date descending (newest first)
  items.sort((a, b) => {
    const dateA = new Date(
      a.type === 'tweet' ? a.tweet.createdAt : a.retweet!.createdAt
    ).getTime();
    const dateB = new Date(
      b.type === 'tweet' ? b.tweet.createdAt : b.retweet!.createdAt
    ).getTime();
    return dateB - dateA;
  });

  return items;
}
