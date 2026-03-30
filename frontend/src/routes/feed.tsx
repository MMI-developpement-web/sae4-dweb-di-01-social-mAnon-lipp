import { useCallback, useEffect, useRef, useState } from "react";
import { redirect, useFetcher, useLoaderData, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import TweetCard from "../components/ui/TweetCard";
import Button from "../components/ui/Button";
import SearchBar from "../components/SearchBar";
import Avatar from "../components/ui/Avatar";
import { useStore } from "../store/StoreContext";
import { fetchTweets, searchTweets, searchUsers, type TweetsResponse, type SearchFilters } from "../lib/api";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { getImageUrl } from "../lib/utils";

const PER_PAGE = 20;

export async function loader(): Promise<TweetsResponse | Response> {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");
  return fetchTweets(1, PER_PAGE);
}

export default function Feed() {
  const initialData = useLoaderData() as TweetsResponse;
  const store = useStore();
  const navigate = useNavigate();
  const { addTweet, initializeLikes, removeTweet } = store;

  const [tweetIds, setTweetIds] = useState<number[]>(initialData.tweets.map(t => t.id));
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(
    initialData.pagination.total_items
  );

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [currentSearchType, setCurrentSearchType] = useState<"tweets" | "users">("tweets");

  const fetcher = useFetcher<TweetsResponse>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = tweetIds.length < totalItems;

  // Initialize Store with loaded tweets and their like state
  useEffect(() => {
    // Add all tweets to the Store cache
    initialData.tweets.forEach((tweet) => addTweet(tweet));
    
    // Initialize liked tweets from the initial feed
    initializeLikes(initialData.tweets);
  }, [initialData.tweets, addTweet, initializeLikes]);

  const fetchFeedData = useCallback(async () => {
    const newData = await fetchTweets(1, PER_PAGE);
    // Add to store
    newData.tweets.forEach((tweet) => addTweet(tweet));
    // Update feed tweet IDs
    setTweetIds(newData.tweets.map(t => t.id));
    setCurrentPage(1);
    setTotalItems(newData.pagination.total_items);
  }, [addTweet]);

  const { isRefreshing, refreshFeed } = useAutoRefresh(fetchFeedData);

  // Handle search
  const handleSearch = useCallback(async (filters: SearchFilters) => {
    setIsSearchLoading(true);
    setIsSearching(true);
    setCurrentPage(1);
    setSearchResults(null);

    try {
      // Si recherche d'utilisateurs
      if (filters.searchType === "users" && filters.q) {
        try {
          const userResult = await searchUsers(filters.q);
          setCurrentSearchType("users");
          setSearchResults(userResult);
          setTweetIds([]);
          return;
        } catch (error: any) {
          console.error("User search error:", error);
          setSearchResults({ notFound: true });
          setTweetIds([]);
          return;
        }
      }

      // Sinon, recherche de tweets
      setCurrentSearchType("tweets");
      const results = await searchTweets(1, PER_PAGE, filters);
      results.tweets.forEach((tweet) => addTweet(tweet));
      setTweetIds(results.tweets.map(t => t.id));
      setTotalItems(results.pagination.total_items);
    } catch (error) {
      console.error("Search error:", error);
      // Reset to normal feed on error
      setIsSearching(false);
      await fetchFeedData();
    } finally {
      setIsSearchLoading(false);
    }
  }, [addTweet, fetchFeedData]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const newTweetIds = fetcher.data.tweets.map(t => t.id);
      // Add to store
      fetcher.data.tweets.forEach((tweet) => addTweet(tweet));
      // Append to feed
      setTweetIds((prev) => [...prev, ...newTweetIds]);
      setTotalItems(fetcher.data.pagination.total_items);
    }
  }, [fetcher.data, fetcher.state, addTweet]);

  const loadMore = useCallback(() => {
    if (fetcher.state !== "idle" || !hasMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    // Load more from search or feed
    if (isSearching) {
      fetcher.load(`/feed?search=1&page=${nextPage}`);
    } else {
      fetcher.load(`/feed?page=${nextPage}`);
    }
  }, [fetcher, hasMore, currentPage, isSearching]);

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
    setTweetIds((prev) => prev.filter((id) => id !== tweetId));
    removeTweet(tweetId);
    setTotalItems((prev) => Math.max(0, prev - 1));
  };

  // Get tweets from Store by their IDs
  const tweets = tweetIds
    .map((id) => store.tweets.get(id))
    .filter((t): t is typeof initialData.tweets[0] => !!t);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <SearchBar onSearch={handleSearch} isLoading={isSearchLoading} />
      <main className="flex flex-col gap-5 px-5 py-5 max-w-2xl mx-auto">
        <div className="flex justify-center gap-3">
          {isSearching && (
            <Button
              onClick={() => {
                setIsSearching(false);
                setSearchResults(null);
                setCurrentPage(1);
                fetchFeedData();
              }}
              variant="secondary"
              size="sm"
            >
              Voir le fil d'actualité
            </Button>
          )}
          <Button
            onClick={refreshFeed}
            disabled={isRefreshing}
            variant="secondary"
            size="sm"
          >
            {isRefreshing ? "Rafraîchissement..." : "Rafraîchir"}
          </Button>
        </div>

        {/* User search results */}
        {isSearching && currentSearchType === "users" && searchResults && (
          <>
            {searchResults.notFound ? (
              <p className="text-center text-tweet-meta text-sm py-8">
                Aucun utilisateur trouvé.
              </p>
            ) : (
              <button
                onClick={() => navigate(`/profile/${searchResults.user.id}`)}
                className="flex items-center gap-4 p-4 rounded-lg border border-border-muted hover:bg-gray-50 transition-colors text-left"
              >
                <Avatar
                  src={searchResults.user.profilePicture}
                  alt={searchResults.user.username}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-text">{searchResults.user.username}</div>
                  <div className="text-sm text-tweet-meta break-words">{searchResults.user.bio || "Aucune bio"}</div>
                  <div className="text-xs text-tweet-meta mt-2">
                    {searchResults.user.followerCount} abonnés · {searchResults.user.followingCount} abonnements
                  </div>
                </div>
              </button>
            )}
          </>
        )}

        {/* Tweet results */}
        {(isSearching && currentSearchType === "tweets") || !isSearching ? (
          <>
            {tweets.length === 0 ? (
              <p className="text-center text-tweet-meta text-sm py-8">
                {isSearching ? "Aucun tweet trouvé." : "Aucun tweet pour le moment."}
              </p>
            ) : (
              tweets.map((tweet) => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  onDelete={handleTweetDeleted}
                />
              ))
            )}
          </>
        ) : null}

        {fetcher.state === "loading" && (
          <p className="text-center text-tweet-meta text-sm py-4">
            Chargement…
          </p>
        )}

        <div ref={sentinelRef} className="h-1" aria-hidden />
      </main>
      <NavBar mode="mobile" />
    </div>
  );
}

