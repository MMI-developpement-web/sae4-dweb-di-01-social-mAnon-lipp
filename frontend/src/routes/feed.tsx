import { useCallback, useEffect } from "react";
import { redirect, useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import TweetCard from "../components/ui/TweetCard";
import RetweetCard from "../components/RetweetCard";
import Button from "../components/ui/Button";
import SearchBar from "../components/SearchBar";
import Avatar from "../components/ui/Avatar";
import { fetchTweets, type TweetsResponse } from "../lib/api";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { useFeed } from "../hooks/useFeed";
import { useSearch } from "../hooks/useSearch";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

const PER_PAGE = 20;

export async function loader(): Promise<TweetsResponse | Response> {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");
  return fetchTweets(1, PER_PAGE);
}

export default function Feed() {
  const initialData = useLoaderData() as TweetsResponse;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Use custom hooks for major concerns
  const feed = useFeed(initialData);
  const search = useSearch();

  // Helper function to reset feed to initial state
  const resetFeed = useCallback(async () => {
    const newData = await fetchTweets(1, PER_PAGE);
    feed.setFeedItems(feed.createUnifiedFeed(newData));
    feed.setTweetIds(newData.tweets.map(t => t.id));
    feed.setCurrentPage(1);
    feed.setTotalItems(newData.pagination.total_items);
  }, [feed]);

  const { isRefreshing, refreshFeed } = useAutoRefresh(resetFeed);

  const infiniteScroll = useInfiniteScroll(
    feed.hasMore,
    feed.currentPage,
    search.isSearching,
    {
      setCurrentPage: feed.setCurrentPage,
      setTweetIds: feed.setTweetIds,
      setTotalItems: feed.setTotalItems,
    }
  );

  // Auto-execute search if query params are present
  useEffect(() => {
    const type = searchParams.get("type");
    const q = searchParams.get("q");
    
    if (type && q) {
      search.handleSearch(
        {
          q,
          searchType: (type as "tweets" | "users" | "hashtag") || "tweets",
        },
        {
          setFeedItems: feed.setFeedItems,
          setTweetIds: feed.setTweetIds,
          setTotalItems: feed.setTotalItems,
          onError: resetFeed,
        }
      );
    }
  }, [searchParams, search, feed, resetFeed]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <SearchBar 
        onSearch={(filters) => 
          search.handleSearch(filters, {
            setFeedItems: feed.setFeedItems,
            setTweetIds: feed.setTweetIds,
            setTotalItems: feed.setTotalItems,
            onError: resetFeed,
          })
        } 
        isLoading={search.isSearchLoading} 
      />
      <main className="flex flex-col gap-5 px-5 py-5 max-w-2xl mx-auto">
        <div className="flex justify-center gap-3">
          {search.isSearching && (
            <Button
              onClick={() => {
                search.resetSearch();
                feed.setCurrentPage(1);
                refreshFeed();
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
        {search.isSearching && search.currentSearchType === "users" && search.searchResults && (
          <>
            {search.searchResults.notFound ? (
              <p className="text-center text-tweet-meta text-sm py-8">
                Aucun utilisateur trouvé.
              </p>
            ) : search.searchResults.user ? (
              <button
                onClick={() => navigate(`/profile/${search.searchResults.user.id}`)}
                className="flex items-center gap-4 p-4 rounded-lg border border-border-muted hover:bg-gray-50 transition-colors text-left"
              >
                <Avatar
                  src={search.searchResults.user.profilePicture}
                  alt={search.searchResults.user.username}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-text">{search.searchResults.user.username}</div>
                  <div className="text-sm text-tweet-meta break-words">{search.searchResults.user.bio || "Aucune bio"}</div>
                  <div className="text-xs text-tweet-meta mt-2">
                    {search.searchResults.user.followerCount} abonnés · {search.searchResults.user.followingCount} abonnements
                  </div>
                </div>
              </button>
            ) : search.searchResults.users ? (
              <div className="grid gap-2">
                {search.searchResults.users.map((u: any) => (
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
        {(search.isSearching && search.currentSearchType === "tweets") || !search.isSearching ? (
          <>
            {feed.feedItems.length === 0 ? (
              <p className="text-center text-tweet-meta text-sm py-8">
                {search.isSearching ? "Aucun tweet trouvé." : "Aucun tweet pour le moment."}
              </p>
            ) : (
              feed.feedItems.map((item) =>
                item.type === 'tweet' ? (
                  <TweetCard
                    key={`tweet-${item.tweet.id}`}
                    tweet={item.tweet}
                    onDelete={feed.handleTweetDeleted}
                    onRetweetCreated={feed.handleRetweetCreated}
                  />
                ) : (
                  <RetweetCard
                    key={`retweet-${item.retweet!.id}`}
                    retweet={item.retweet!}
                    onDelete={feed.handleTweetDeleted}
                    onRetweetCreated={feed.handleRetweetCreated}
                  />
                )
              )
            )}
          </>
        ) : null}

        {infiniteScroll.fetcher.state === "loading" && (
          <p className="text-center text-tweet-meta text-sm py-4">
            Chargement…
          </p>
        )}

        <div ref={infiniteScroll.sentinelRef} className="h-1" aria-hidden />
      </main>
      <NavBar mode="mobile" />
    </div>
  );
}

