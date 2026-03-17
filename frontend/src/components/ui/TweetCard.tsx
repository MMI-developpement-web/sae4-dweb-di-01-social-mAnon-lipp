import { cva, type VariantProps } from "class-variance-authority";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { Tweet } from "../../lib/api";
import Avatar from "./Avatar";

const tweetCardVariants = cva(
  "flex gap-3 items-start rounded-lg p-4 w-full",
  {
    variants: {
      variant: {
        default: "bg-tweet-bg",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface TweetCardProps extends VariantProps<typeof tweetCardVariants> {
  tweet: Tweet;
  className?: string;
}

function formatDate(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TweetCard({ tweet, variant, className }: TweetCardProps) {
  const navigate = useNavigate();

  const handleAuthorClick = () => {
    navigate(`/profile/${tweet.author.id}`);
  };

  return (
    <article className={cn(tweetCardVariants({ variant }), className)}>
      {/* Avatar */}
      <button
        onClick={handleAuthorClick}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label={`View ${tweet.author.username}'s profile`}
      >
        <Avatar
          src={tweet.author.profilePicture}
          alt={tweet.author.username}
          size="sm"
        />
      </button>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header with username and time */}
        <div className="flex gap-1 items-center text-sm pb-2 flex-wrap">
          <button
            onClick={handleAuthorClick}
            className="font-bold text-tweet-author hover:underline transition-colors"
          >
            {tweet.author.username}
          </button>
          <span className="text-tweet-meta">·</span>
          <span className="text-tweet-meta font-medium text-xs">
            {formatDate(tweet.createdAt)}
          </span>
        </div>

        {/* Tweet content */}
        <p className="text-tweet-text text-sm font-medium leading-normal break-words w-full">
          {tweet.content}
        </p>
      </div>
    </article>
  );
}
