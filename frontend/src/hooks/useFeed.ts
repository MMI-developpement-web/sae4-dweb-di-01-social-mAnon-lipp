import { useEffect, useState } from "react";
import { useStore } from "../store/StoreContext";
import { type TweetsResponse } from "../lib/api";
import { createUnifiedFeed, type FeedItem } from "../lib/feed-helpers";

export function useFeed(initialData: TweetsResponse) {
  const { addTweet, initializeLikes, initializeRetweets, removeTweet, tweets } = useStore();

  const [feedItems, setFeedItems] = useState(createUnifiedFeed(initialData));
  const [tweetIds, setTweetIds] = useState<number[]>(initialData.tweets.map(t => t.id));
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(initialData.pagination.total_items);

  const hasMore = tweetIds.length < totalItems;

  // Initialize Store with loaded tweets and their like state
  useEffect(() => {
    initialData.tweets.forEach((tweet) => addTweet(tweet));
    initialData.retweets.forEach((retweet) => addTweet(retweet.originalTweet));
    
    initializeLikes([...initialData.tweets, ...initialData.retweets.map(r => r.originalTweet)]);
    initializeRetweets([...initialData.tweets, ...initialData.retweets.map(r => r.originalTweet)]);
  }, [initialData.tweets, initialData.retweets, addTweet, initializeLikes, initializeRetweets]);

  // Update tweet references when store tweets change (likes, retweets, etc.)
  useEffect(() => {
    setFeedItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        tweet: tweets.get(item.tweet.id) || item.tweet,
      }))
    );
  }, [tweets]);

  const handleTweetDeleted = (tweetId: number) => {
    setFeedItems((prev) => prev.filter((item) => item.tweet.id !== tweetId));
    removeTweet(tweetId);
    setTotalItems((prev) => Math.max(0, prev - 1));
  };

  const handleRetweetCreated = (retweet: any) => {
    setFeedItems((prev) => {
      const updated = prev.map((item) => {
        if (item.type === 'tweet' && item.tweet.id === retweet.originalTweet.id) {
          return { ...item, tweet: retweet.originalTweet };
        }
        return item;
      });

      const newFeedItem: FeedItem = {
        type: 'retweet',
        tweet: retweet.originalTweet,
        retweet: retweet
      };
      
      return [newFeedItem, ...updated];
    });
    setTotalItems((prev) => prev + 1);
  };

  return {
    feedItems,
    setFeedItems,
    tweetIds,
    setTweetIds,
    currentPage,
    setCurrentPage,
    totalItems,
    setTotalItems,
    hasMore,
    createUnifiedFeed,
    handleTweetDeleted,
    handleRetweetCreated,
  };
}
