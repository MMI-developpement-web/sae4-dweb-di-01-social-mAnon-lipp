import { useCallback, useEffect, useRef } from "react";
import { useFetcher } from "react-router-dom";
import { type TweetsResponse } from "../lib/api";
import { useStore } from "../store/StoreContext";

export function useInfiniteScroll(
  hasMore: boolean,
  currentPage: number,
  isSearching: boolean,
  callbacks: {
    setCurrentPage: (page: number) => void;
    setTweetIds: (fn: (prev: number[]) => number[]) => void;
    setTotalItems: (fn: (prev: number) => number) => void;
  }
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher<TweetsResponse>();
  const { addTweet } = useStore();

  // Handle fetcher data updates
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const newTweetIds = fetcher.data.tweets.map(t => t.id);
      fetcher.data.tweets.forEach((tweet) => addTweet(tweet));
      
      callbacks.setTweetIds((prev) => [...prev, ...newTweetIds]);
      callbacks.setTotalItems(() => fetcher.data!.pagination.total_items);
    }
  }, [fetcher.data, fetcher.state, addTweet, callbacks]);

  const loadMore = useCallback(() => {
    if (fetcher.state !== "idle" || !hasMore) return;
    const nextPage = currentPage + 1;
    callbacks.setCurrentPage(nextPage);

    if (isSearching) {
      fetcher.load(`/feed?search=1&page=${nextPage}`);
    } else {
      fetcher.load(`/feed?page=${nextPage}`);
    }
  }, [fetcher, hasMore, currentPage, isSearching, callbacks]);

  // Setup intersection observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return {
    sentinelRef,
    fetcher,
  };
}
