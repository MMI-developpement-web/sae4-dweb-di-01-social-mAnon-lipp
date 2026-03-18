import { useNavigate, redirect, useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import Header from "../components/Header";
import NavBar from "../components/NavBar";
import TweetCard from "../components/ui/TweetCard";
import Avatar from "../components/ui/Avatar";
import Banner from "../components/ui/Banner";
import Button from "../components/ui/Button";
import { fetchUserProfile, type ProfileResponse } from "../lib/api";

export async function loader({ params }: LoaderFunctionArgs): Promise<ProfileResponse | Response> {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");
  
  const userId = parseInt(params.id!, 10);
  return fetchUserProfile(userId, 1, 20);
}

export default function Profile() {
  const navigate = useNavigate();
  const data = useLoaderData() as ProfileResponse;
  const { user, tweets } = data;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="flex flex-col">
        {/* Banner with back button */}
        <div className="relative">
          <Banner src={user.banner} alt={`${user.username}'s banner`} />
          <div className="absolute top-5 left-5">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Retour"
            >
              <svg className="w-3 h-5" viewBox="0 0 13 20" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 2L2 10l9 8" />
              </svg>
            </Button>
          </div>
        </div>

        {/* User profile card */}
        <article className="px-5 py-5">
          {/* Avatar + Name/Bio */}
          <div className="flex gap-4 mb-6">
            <div className="-mt-24 relative z-10">
              <Avatar
                src={user.profilePicture}
                alt={user.username}
                size="lg"
                className="rounded-lg border-4 border-background"
              />
            </div>
            <div className="flex-1 pt-2">
              <h1 className="text-xl font-bold text-text-primary">{user.username}</h1>
              {user.bio && <p className="text-text-muted text-sm mt-1">{user.bio}</p>}
            </div>
          </div>

          {/* Location & Website */}
          <div className="space-y-2 text-sm text-text-muted">
            {user.location && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{user.location}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <a 
                  href={user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-tweet-author hover:underline"
                >
                  {user.website}
                </a>
              </div>
            )}
          </div>
        </article>

        {/* Posts section */}
        <section className="border-t border-border-muted">
          <header className="px-5 py-4">
            <h2 className="text-sm font-medium text-text-primary">Posts</h2>
          </header>
          {tweets.length > 0 ? (
            <div className="flex flex-col gap-3 px-5 pb-5">
              {tweets.map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
          ) : (
            <div className="px-5 pb-5">
              <p className="text-center text-text-muted py-8 text-sm">Aucun tweet pour le moment</p>
            </div>
          )}
        </section>
      </main>
      <NavBar />
    </div>
  );
}
