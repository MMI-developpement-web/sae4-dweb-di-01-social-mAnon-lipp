import { useNavigate } from "react-router-dom";
import type { Tweet } from "../../lib/api";

interface TweetHeaderProps {
  tweet: Tweet;
  isOwner: boolean;
  isPinning: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onUnpin: () => void;
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

export default function TweetHeader({
  tweet,
  isOwner,
  isPinning,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
}: TweetHeaderProps) {
  const navigate = useNavigate();

  const handleAuthorClick = () => {
    navigate(`/profile/${tweet.author.id}`);
  };

  return (
    <>
      {/* Header line with username, date and buttons */}
      <div className="flex gap-1 items-center text-sm pb-2 flex-wrap justify-between">
        <div className="flex gap-1 items-center flex-wrap">
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
          {tweet.updatedAt && (
            <>
              <span className="text-tweet-meta">·</span>
              <span className="text-tweet-meta font-medium text-xs">
                Modifié {formatDate(tweet.updatedAt)}
              </span>
            </>
          )}
        </div>

        {/* Edit and Delete buttons (visible only if owner) */}
        {isOwner && (
          <div className="flex gap-2">
            {/* Pin/Unpin button */}
            <button
              onClick={tweet.isPinned ? onUnpin : onPin}
              disabled={isPinning}
              className={`rounded-full p-2 transition-colors flex-shrink-0 ${
                tweet.isPinned
                  ? "text-yellow-500 hover:bg-yellow-50"
                  : "text-tweet-meta hover:bg-yellow-50 hover:text-yellow-500"
              }`}
              aria-label={tweet.isPinned ? "Désépingler le tweet" : "Épingler le tweet"}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill={tweet.isPinned ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.1835 7.80516L16.2188 4.83755C14.1921 2.8089 13.1788 1.79457 12.0904 2.03468C11.0021 2.2748 10.5086 3.62155 9.5217 6.31506L8.85373 8.1381C8.59063 8.85617 8.45908 9.2152 8.22239 9.49292C8.11619 9.61754 7.99536 9.72887 7.86251 9.82451C7.56644 10.0377 7.19811 10.1392 6.46145 10.3423C4.80107 10.8 3.97088 11.0289 3.65804 11.5721C3.5228 11.8069 3.45242 12.0735 3.45413 12.3446C3.45809 12.9715 4.06698 13.581 5.28476 14.8L6.69935 16.2163L2.22345 20.6964C1.92552 20.9946 1.92552 21.4782 2.22345 21.7764C2.52138 22.0746 3.00443 22.0746 3.30236 21.7764L7.77841 17.2961L9.24441 18.7635C10.4699 19.9902 11.0827 20.6036 11.7134 20.6045C11.9792 20.6049 12.2404 20.5358 12.4713 20.4041C13.0192 20.0914 13.2493 19.2551 13.7095 17.5825C13.9119 16.8472 14.013 16.4795 14.2254 16.1835C14.3184 16.054 14.4262 15.9358 14.5468 15.8314C14.8221 15.593 15.1788 15.459 15.8922 15.191L17.7362 14.4981C20.4 13.4973 21.7319 12.9969 21.9667 11.9115C22.2014 10.826 21.1954 9.81905 19.1835 7.80516Z" />
              </svg>
            </button>
            <button
              onClick={onEdit}
              className="text-blue-500 hover:bg-blue-50 rounded-full p-2 transition-colors flex-shrink-0"
              aria-label="Modifier le tweet"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors flex-shrink-0"
              aria-label="Supprimer le tweet"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
