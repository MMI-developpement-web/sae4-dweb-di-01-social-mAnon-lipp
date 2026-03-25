import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../../lib/utils";
import type { Reply } from "../../lib/api";
import Avatar from "./Avatar";

interface ReplyListProps {
  replies?: Reply[];
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

export default function ReplyList({ replies = [] }: ReplyListProps) {
  const navigate = useNavigate();

  if (replies.length === 0) return null;

  return (
    <div className="border-l-2 border-tweet-meta pl-4 py-2 space-y-3">
      {replies.map((reply) => (
        <div key={reply.id} className="flex gap-3 items-start">
          <button
            onClick={() => navigate(`/profile/${reply.author.id}`)}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={reply.author.profilePicture ? getImageUrl(reply.author.profilePicture) : undefined}
              alt={reply.author.username}
              size="sm"
            />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex gap-1 items-center text-xs">
              <button
                onClick={() => navigate(`/profile/${reply.author.id}`)}
                className="font-bold text-tweet-author hover:underline"
              >
                {reply.author.username}
              </button>
              <span className="text-tweet-meta">·</span>
              <span className="text-tweet-meta">
                {formatDate(reply.createdAt)}
              </span>
            </div>
            <p className="text-sm text-tweet-text mt-1 break-words">
              {reply.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}