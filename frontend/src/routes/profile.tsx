import { useNavigate, redirect, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import ProfileHeader from "../components/ProfileHeader";
import TweetCard from "../components/ui/TweetCard";
import Banner from "../components/ui/Banner";
import Button from "../components/ui/Button";
import { useStore } from "../store/StoreContext";
import {
  fetchUserProfile,
  fetchUserTweets,
  fetchCurrentUser,
  type UserProfile,
} from "../lib/api";
import type { Tweet } from "../store/types";

interface LoaderData {
  currentUser: { id: number };
  profile: UserProfile;
  tweets: Tweet[];
}

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData | Response> {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");

  const userId = parseInt(params.id!, 10);

  try {
    const [currentUserRes, profileRes, tweetsRes] = await Promise.all([
      fetchCurrentUser(),
      fetchUserProfile(userId),
      fetchUserTweets(userId, 1, 20),
    ]);

    return {
      currentUser: { id: currentUserRes.id },
      profile: profileRes.user,
      tweets: tweetsRes.tweets,
    };
  } catch (error) {
    console.error("Profile loader error:", error);
    throw error;
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const loaderData = useLoaderData() as LoaderData;
  const { currentUser } = loaderData;
  const store = useStore();

  const [profile, setProfile] = useState(loaderData.profile);
  const isOwnProfile = currentUser.id === profile.id;

  // Sync local state with loader data, including follow status changes
  useEffect(() => {
    setProfile(loaderData.profile);
    
    // Add loader tweets to Store on mount so pin state persists
    loaderData.tweets.forEach((tweet) => {
      if (!store.tweets.has(tweet.id)) {
        store.addTweet(tweet);
      }
    });
  }, [loaderData.profile, loaderData.tweets, store]);

  const handleTweetDeleted = (tweetId: number) => {
    store.removeTweet(tweetId);
  };

  // Get tweets from Store, filtered to only those for this profile
  const allStoredTweets = Array.from(store.tweets.values()).filter(
    (tweet) => tweet.author.id === profile.id
  );
  
  // Use stored tweets if available, otherwise use loader data
  const tweets = allStoredTweets.length > 0 ? allStoredTweets : loaderData.tweets;

  const handleFollowChange = async () => {
    try {
      const updatedProfile = await fetchUserProfile(profile.id);
      setProfile(updatedProfile.user);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex flex-col">
        {/* Banner with back button and edit button */}
        <div className="relative">
          <Banner
            src={profile.bannerPicture}
            alt={`${profile.username}'s banner`}
          />
          <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Retour"
            >
              <svg
                className="w-3 h-5"
                viewBox="0 0 13 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 2L2 10l9 8" />
              </svg>
            </Button>
            {isOwnProfile && (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => navigate('/profile/edit')}
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Modifier
              </Button>
            )}
          </div>
        </div>

        {/* Profile header with follow button */}
        <ProfileHeader
          user={profile}
          isOwnProfile={isOwnProfile}
          onFollowChange={handleFollowChange}
        />

        {/* Posts sections */}
        {tweets.length > 0 ? (
          <>
            {/* Pinned Posts Section */}
            {tweets.some((t) => t.isPinned) && (
              <section className="border-t border-border-muted">
                <header className="px-5 py-4">
                  <h2 className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-yellow-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M19.1835 7.80516L16.2188 4.83755C14.1921 2.8089 13.1788 1.79457 12.0904 2.03468C11.0021 2.2748 10.5086 3.62155 9.5217 6.31506L8.85373 8.1381C8.59063 8.85617 8.45908 9.2152 8.22239 9.49292C8.11619 9.61754 7.99536 9.72887 7.86251 9.82451C7.56644 10.0377 7.19811 10.1392 6.46145 10.3423C4.80107 10.8 3.97088 11.0289 3.65804 11.5721C3.5228 11.8069 3.45242 12.0735 3.45413 12.3446C3.45809 12.9715 4.06698 13.581 5.28476 14.8L6.69935 16.2163L2.22345 20.6964C1.92552 20.9946 1.92552 21.4782 2.22345 21.7764C2.52138 22.0746 3.00443 22.0746 3.30236 21.7764L7.77841 17.2961L9.24441 18.7635C10.4699 19.9902 11.0827 20.6036 11.7134 20.6045C11.9792 20.6049 12.2404 20.5358 12.4713 20.4041C13.0192 20.0914 13.2493 19.2551 13.7095 17.5825C13.9119 16.8472 14.013 16.4795 14.2254 16.1835C14.3184 16.054 14.4262 15.9358 14.5468 15.8314C14.8221 15.593 15.1788 15.459 15.8922 15.191L17.7362 14.4981C20.4 13.4973 21.7319 12.9969 21.9667 11.9115C22.2014 10.826 21.1954 9.81905 19.1835 7.80516Z" />
                    </svg>
                    Posts Épinglés
                  </h2>
                </header>
                <div className="px-5 pb-5">
                  <div className="flex flex-col gap-3">
                    {tweets
                      .filter((tweet) => tweet.isPinned)
                      .map((tweet) => (
                        <div
                          key={tweet.id}
                          className="border-2 border-yellow-300 rounded-lg overflow-hidden bg-yellow-50 dark:bg-opacity-10"
                        >
                          <TweetCard
                            tweet={tweet}
                            onDelete={handleTweetDeleted}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </section>
            )}

            {/* Regular Posts Section */}
            <section className="border-t border-border-muted">
              <header className="px-5 py-4">
                <h2 className="text-sm font-medium text-text-primary">Posts</h2>
              </header>
              <div className="px-5 pb-5">
                <div className="flex flex-col gap-3">
                  {tweets
                    .filter((tweet) => !tweet.isPinned)
                    .map((tweet) => (
                      <TweetCard
                        key={tweet.id}
                        tweet={tweet}
                        onDelete={handleTweetDeleted}
                      />
                    ))}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="border-t border-border-muted">
            <header className="px-5 py-4">
              <h2 className="text-sm font-medium text-text-primary">Posts</h2>
            </header>
            <div className="px-5 pb-5">
              <p className="text-center text-text-muted py-8 text-sm">
                Aucun tweet pour le moment
              </p>
            </div>
          </section>
        )}
      </main>
      <NavBar />
    </div>
  );
}

