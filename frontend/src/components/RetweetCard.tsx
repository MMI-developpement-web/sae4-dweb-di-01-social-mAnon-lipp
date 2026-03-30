import TweetCard from "./ui/TweetCard";
import Avatar from "./ui/Avatar";
import type { RetweetDisplay } from "../lib/api";

interface RetweetCardProps {
  retweet: RetweetDisplay;
  onDelete: (tweetId: number) => void;
  onRetweetCreated?: (retweet: any) => void;
}

export default function RetweetCard({ retweet, onDelete, onRetweetCreated }: RetweetCardProps) {
  return (
    <div className="flex flex-col">
      {/* Retweet header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-0 text-tweet-meta text-sm">
        <Avatar
          src={retweet.author.profilePicture}
          alt={retweet.author.username}
          size="sm"
        />
        <span>
          <strong>{retweet.author.username}</strong> a retweeté
        </span>
      </div>

      {/* Optional retweet comment */}
      {retweet.content && (
        <div className="px-4 pt-2 pb-2 text-sm border-l-2 border-border-muted pl-4">
          <p className="text-text">{retweet.content}</p>
          <p className="text-tweet-meta text-xs mt-1">
            {new Date(retweet.createdAt).toLocaleDateString('fr-FR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      )}

      {/* Original tweet */}
      <div className="scale-[0.98] origin-top-left">
        <TweetCard 
          tweet={retweet.originalTweet} 
          onDelete={onDelete}
          hideReplies={true}
          onRetweetCreated={onRetweetCreated}
        />
      </div>
    </div>
  );
}
