import { useCallback, useState } from "react";
import { searchTweets, searchUsers, type SearchFilters } from "../lib/api";
import { useStore } from "../store/StoreContext";
import { createUnifiedFeed, type FeedItem } from "../lib/feed-helpers";

const PER_PAGE = 20;

export interface SearchCallbacks {
  setFeedItems: (items: FeedItem[]) => void;
  setTweetIds: (ids: number[]) => void;
  setTotalItems: (count: number) => void;
}

export function useSearch() {
  const { addTweet } = useStore();
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [currentSearchType, setCurrentSearchType] = useState<"tweets" | "users">("tweets");

  // Handle search with error recovery built-in
  const handleSearch = useCallback(async (
    filters: SearchFilters,
    callbacks: SearchCallbacks & { onError?: () => Promise<void> }
  ) => {
    const { setFeedItems, setTweetIds, setTotalItems, onError } = callbacks;
    setIsSearchLoading(true);
    setIsSearching(true);

    try {
      // Search for users
      if (filters.searchType === "users" && filters.q) {
        try {
          const usernameQuery = filters.q.startsWith('@') ? filters.q.slice(1) : filters.q;
          const userResult = await searchUsers(usernameQuery);
          setCurrentSearchType("users");
          
          if (!userResult.users || userResult.users.length === 0) {
            setSearchResults({ notFound: true });
            setTweetIds([]);
            return;
          }

          if (userResult.users.length === 1) {
            setSearchResults({ user: userResult.users[0] });
            setTweetIds([]);
            return;
          }

          // Multiple results
          setSearchResults({ users: userResult.users });
          setTweetIds([]);
          return;
        } catch (error: any) {
          console.error("User search error:", error);
          setSearchResults({ notFound: true });
          setTweetIds([]);
          return;
        }
      }

      // Search for hashtags
      if (filters.searchType === "hashtag" && filters.q) {
        const hashtagQuery = filters.q.startsWith('#') ? filters.q.slice(1) : filters.q;
        try {
          const results = await searchTweets(1, PER_PAGE, { q: `#${hashtagQuery}` });
          setCurrentSearchType("tweets");
          
          results.tweets.forEach((tweet) => addTweet(tweet));
          results.retweets.forEach((retweet) => addTweet(retweet.originalTweet));
          
          const searchItems = createUnifiedFeed(results);
          const allTweetIds = searchItems.map(item => item.tweet.id);
          
          setFeedItems(searchItems);
          setTweetIds(allTweetIds);
          setTotalItems(results.pagination.total_items);
          setSearchResults({ hashtag: hashtagQuery, count: searchItems.length });
        } catch (error: any) {
          console.error("Hashtag search error:", error);
          setSearchResults({ hashtag: filters.q, notFound: true });
          setTweetIds([]);
        }
        setIsSearchLoading(false);
        return;
      }

      // Search for tweets
      setCurrentSearchType("tweets");
      const results = await searchTweets(1, PER_PAGE, filters);
      
      results.tweets.forEach((tweet) => addTweet(tweet));
      results.retweets.forEach((retweet) => addTweet(retweet.originalTweet));
      
      const searchItems = createUnifiedFeed(results);
      const allTweetIds = searchItems.map(item => item.tweet.id);
      
      setFeedItems(searchItems);
      setTweetIds(allTweetIds);
      setTotalItems(results.pagination.total_items);
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
      // Call error handler if provided (e.g., to refresh feed)
      if (onError) {
        await onError();
      }
    } finally {
      setIsSearchLoading(false);
    }
  }, [addTweet, createUnifiedFeed]);

  const resetSearch = useCallback(() => {
    setIsSearching(false);
    setSearchResults(null);
    setCurrentSearchType("tweets");
  }, []);

  return {
    isSearching,
    isSearchLoading,
    searchResults,
    currentSearchType,
    handleSearch,
    resetSearch,
  };
}
