import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import type { Tweet } from "../../lib/api";

const tweetCardVariants = cva(
  "flex flex-col items-start rounded-[9px] p-[6px] w-full",
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
  return (
    <article className={cn(tweetCardVariants({ variant }), className)}>
      <div className="flex gap-[10px] items-start w-full">
        <div className="flex flex-col items-start flex-1 min-w-0">
          <div className="flex gap-1 items-center text-[15px] pb-1 w-full whitespace-nowrap overflow-hidden">
            <span className="font-semibold text-tweet-author shrink-0">
              {tweet.author.username}
            </span>
            <span className="text-tweet-meta shrink-0">·</span>
            <span className="text-tweet-meta font-medium shrink-0">
              {formatDate(tweet.createdAt)}
            </span>
          </div>
          <p className="text-tweet-text text-[14px] font-medium leading-normal break-words w-full">
            {tweet.content}
          </p>
        </div>
      </div>
    </article>
  );
}
