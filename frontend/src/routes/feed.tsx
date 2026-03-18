import { useCallback, useEffect, useRef, useState } from "react";
import { redirect, useFetcher, useLoaderData } from "react-router-dom";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import TweetCard from "../components/ui/TweetCard";
import { fetchTweets, type TweetsResponse } from "../lib/api";

const PER_PAGE = 20;

export async function loader(): Promise<TweetsResponse | Response> {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");
  return fetchTweets(1, PER_PAGE);
}

export default function Feed() {
  const initialData = useLoaderData() as TweetsResponse;

  const [tweets, setTweets] = useState(initialData.tweets);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(
    initialData.pagination.total_items
  );

  const fetcher = useFetcher<TweetsResponse>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = tweets.length < totalItems;

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      setTweets((prev) => [...prev, ...fetcher.data!.tweets]);
      setTotalItems(fetcher.data.pagination.total_items);
    }
  }, [fetcher.data, fetcher.state]);

  const loadMore = useCallback(() => {
    if (fetcher.state !== "idle" || !hasMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetcher.load(`/feed?page=${nextPage}`);
  }, [fetcher, hasMore, currentPage]);

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

  const handleTweetDeleted = (tweetId: number) => {
    setTweets((prev) => prev.filter((t) => t.id !== tweetId));
    setTotalItems((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex flex-col gap-5 px-5 py-5">
        {tweets.map((tweet) => (
          <TweetCard 
            key={tweet.id} 
            tweet={tweet}
            onDelete={handleTweetDeleted}
          />
        ))}

        {fetcher.state === "loading" && (
          <p className="text-center text-tweet-meta text-sm py-4">
            Chargement…
          </p>
        )}

        <div ref={sentinelRef} className="h-1" aria-hidden />
      </main>
      <NavBar />
    </div>
  );
}

