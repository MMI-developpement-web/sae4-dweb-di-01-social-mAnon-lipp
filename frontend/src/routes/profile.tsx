import { useNavigate, redirect, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import ProfileHeader from "../components/ProfileHeader";
import TweetCard from "../components/ui/TweetCard";
import Banner from "../components/ui/Banner";
import Button from "../components/ui/Button";
import {
  fetchUserProfile,
  fetchUserTweets,
  fetchCurrentUser,
  type UserProfile,
  type Tweet,
} from "../lib/api";

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

  const [profile, setProfile] = useState(loaderData.profile);
  const [tweets, setTweets] = useState(loaderData.tweets);
  const isOwnProfile = currentUser.id === profile.id;

  // Sync local state with loader data, including follow status changes
  useEffect(() => {
    setProfile(loaderData.profile);
    setTweets(loaderData.tweets);
  }, [loaderData.profile, loaderData.tweets]);

  const handleTweetDeleted = (tweetId: number) => {
    setTweets((prev) => prev.filter((t) => t.id !== tweetId));
  };

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
        {/* Banner with back button */}
        <div className="relative">
          <Banner
            src={profile.banner}
            alt={`${profile.username}'s banner`}
          />
          <div className="absolute top-5 left-5">
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
          </div>
        </div>

        {/* Profile header with follow button */}
        <ProfileHeader
          user={profile}
          isOwnProfile={isOwnProfile}
          onFollowChange={handleFollowChange}
        />

        {/* Posts section */}
        <section className="border-t border-border-muted">
          <header className="px-5 py-4">
            <h2 className="text-sm font-medium text-text-primary">Posts</h2>
          </header>
          {tweets.length > 0 ? (
            <div className="flex flex-col gap-3 px-5 pb-5">
              {tweets.map((tweet) => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  onDelete={handleTweetDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 pb-5">
              <p className="text-center text-text-muted py-8 text-sm">
                Aucun tweet pour le moment
              </p>
            </div>
          )}
        </section>
      </main>
      <NavBar />
    </div>
  );
}

