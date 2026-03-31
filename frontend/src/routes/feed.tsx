import { useCallback, useEffect, useRef, useState } from "react";
import { redirect, useFetcher, useLoaderData, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import TweetCard from "../components/ui/TweetCard";
import RetweetCard from "../components/RetweetCard";
import Button from "../components/ui/Button";
import SearchBar from "../components/SearchBar";
import Avatar from "../components/ui/Avatar";
import { useStore } from "../store/StoreContext";
import { fetchTweets, searchTweets, searchUsers, type TweetsResponse, type SearchFilters } from "../lib/api";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

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
  const { addTweet, initializeLikes, initializeRetweets, removeTweet } = store;

  // Create unified feed from tweets and retweets, sorted by date
  const createUnifiedFeed = (response: TweetsResponse): Array<{ type: 'tweet' | 'retweet'; tweet: any; retweet?: any }> => {
    const items: Array<{ type: 'tweet' | 'retweet'; tweet: any; retweet?: any }> = [];
    
    // Add tweets
    response.tweets.forEach(tweet => {
      items.push({ type: 'tweet', tweet });
    });
    
    // Add retweets with their original tweets
    response.retweets.forEach(retweet => {
      items.push({
        type: 'retweet',
        tweet: retweet.originalTweet,
        retweet: retweet
      });
    });
    
    // Sort by date descending
    items.sort((a, b) => {
      const dateA = new Date(a.type === 'tweet' ? a.tweet.createdAt : a.retweet!.createdAt).getTime();
      const dateB = new Date(b.type === 'tweet' ? b.tweet.createdAt : b.retweet!.createdAt).getTime();
      return dateB - dateA;
    });
    
    return items;
  };

  const [feedItems, setFeedItems] = useState(createUnifiedFeed(initialData));
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
    // Add all tweets to the Store cache (including original tweets from retweets)
    initialData.tweets.forEach((tweet) => addTweet(tweet));
    initialData.retweets.forEach((retweet) => addTweet(retweet.originalTweet));
    
    // Initialize liked tweets from the initial feed
    initializeLikes([...initialData.tweets, ...initialData.retweets.map(r => r.originalTweet)]);
    
    // Initialize retweets from the initial feed
    initializeRetweets([...initialData.tweets, ...initialData.retweets.map(r => r.originalTweet)]);
  }, [initialData.tweets, initialData.retweets, addTweet, initializeLikes, initializeRetweets]);

  const fetchFeedData = useCallback(async () => {
    const newData = await fetchTweets(1, PER_PAGE);
    // Add to store
    newData.tweets.forEach((tweet) => addTweet(tweet));
    newData.retweets.forEach((retweet) => addTweet(retweet.originalTweet));
    // Update feed items with unified list
    setFeedItems(createUnifiedFeed(newData));
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
          // Handle zero, one or multiple matches
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

      // Sinon, recherche de tweets
      setCurrentSearchType("tweets");
      const results = await searchTweets(1, PER_PAGE, filters);
      
      // Add tweets and original tweets from retweets to store
      results.tweets.forEach((tweet) => addTweet(tweet));
      results.retweets.forEach((retweet) => addTweet(retweet.originalTweet));
      
      // Create unified feed items, sorted by date
      const searchItems: Array<{ type: 'tweet' | 'retweet'; tweet: any; retweet?: any }> = [];
      results.tweets.forEach(tweet => {
        searchItems.push({ type: 'tweet', tweet });
      });
      results.retweets.forEach(retweet => {
        searchItems.push({
          type: 'retweet',
          tweet: retweet.originalTweet,
          retweet: retweet
        });
      });
      
      // Sort by date descending
      searchItems.sort((a, b) => {
        const dateA = new Date(a.type === 'tweet' ? a.tweet.createdAt : a.retweet!.createdAt).getTime();
        const dateB = new Date(b.type === 'tweet' ? b.tweet.createdAt : b.retweet!.createdAt).getTime();
        return dateB - dateA;
      });
      
      // Set tweet IDs from all items
      const allTweetIds = searchItems.map(item => item.type === 'tweet' ? item.tweet.id : item.tweet.id);
      setFeedItems(searchItems);
      setTweetIds(allTweetIds);
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
    // Remove from feed items
    setFeedItems((prev) => prev.filter((item) => item.tweet.id !== tweetId));
    removeTweet(tweetId);
    setTotalItems((prev) => Math.max(0, prev - 1));
  };

  const handleRetweetCreated = (retweet: any) => {
    // Add new retweet to the start of the feed
    const newFeedItem = {
      type: 'retweet' as const,
      tweet: retweet.originalTweet,
      retweet: retweet
    };
    
    setFeedItems((prev) => [newFeedItem, ...prev]);
    // Add original tweet to store if not already there
    addTweet(retweet.originalTweet);
    setTotalItems((prev) => prev + 1);
  };

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
            ) : searchResults.user ? (
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
            ) : searchResults.users ? (
              <div className="grid gap-2">
                {searchResults.users.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => navigate(`/profile/${u.id}`)}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border-muted hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar src={u.profilePicture} alt={u.username} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-text">{u.username}</div>
                      <div className="text-sm text-tweet-meta break-words">{u.bio || "Aucune bio"}</div>
                      <div className="text-xs text-tweet-meta mt-2">{u.followerCount} abonnés · {u.followingCount} abonnements</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}

        {/* Tweet results */}
        {(isSearching && currentSearchType === "tweets") || !isSearching ? (
          <>
            {feedItems.length === 0 ? (
              <p className="text-center text-tweet-meta text-sm py-8">
                {isSearching ? "Aucun tweet trouvé." : "Aucun tweet pour le moment."}
              </p>
            ) : (
              feedItems.map((item) => (
                item.type === 'tweet' ? (
                  <TweetCard
                    key={`tweet-${item.tweet.id}`}
                    tweet={item.tweet}
                    onDelete={handleTweetDeleted}
                    onRetweetCreated={handleRetweetCreated}
                  />
                ) : (
                  <RetweetCard
                    key={`retweet-${item.retweet!.id}`}
                    retweet={item.retweet!}
                    onDelete={handleTweetDeleted}
                    onRetweetCreated={handleRetweetCreated}
                  />
                )
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

