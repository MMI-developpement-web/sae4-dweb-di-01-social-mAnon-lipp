import { cva, type VariantProps } from "class-variance-authority";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { getImageUrl } from "../../lib/utils";
import { useStore } from "../../store/StoreContext";
import type { Tweet, Reply } from "../../lib/api";
import Avatar from "./Avatar";
import Heart from "./Heart";
import ReplyForm from "./ReplyForm";
import ReplyList from "./ReplyList";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import EditTweetModal from "../EditTweetModal";

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
  onDelete?: (tweetId: number) => void;
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

export default function TweetCard({ tweet, variant, className, onDelete }: TweetCardProps) {
  const navigate = useNavigate();
  const {
    currentUser,
    tweets,
    likeTweet,
    unlikeTweet,
    deleteTweet,
    modifyTweet,
    isLiked,
    errors,
    clearError,
  } = useStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Load replies from tweet when component mounts or tweet changes
  useEffect(() => {
    if (tweet.replies && tweet.replies.length > 0) {
      setReplies(tweet.replies);
    }
  }, [tweet.id]);

  // Get the latest tweet from store (or use passed tweet)
  const currentTweet = tweets.get(tweet.id) || tweet;
  const isCurrentUserLiked = isLiked(tweet.id);
  const isOwner = currentUser && currentUser.id === tweet.author.id;

  // Get error for like action
  const likeError = errors['likeTweet'] || errors['unlikeTweet'] || null;

  const handleAuthorClick = () => {
    navigate(`/profile/${tweet.author.id}`);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTweet(tweet.id);
      setShowDeleteModal(false);
      onDelete?.(tweet.id);
      clearError('deleteTweet');
    } catch (error) {
      console.error("Erreur lors de la suppression du tweet:", error);
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await likeTweet(tweet.id);
      clearError('likeTweet');
    } catch (error) {
      console.error("Erreur lors du like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleUnlike = async () => {
    setIsLiking(true);
    try {
      await unlikeTweet(tweet.id);
      clearError('unlikeTweet');
    } catch (error) {
      console.error("Erreur lors du unlike:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleConfirmEdit = async (newContent: string, remainingMediaIndices: number[]) => {
    setIsModifying(true);
    try {
      const remainingMedias = remainingMediaIndices
        .map((idx) => currentTweet.medias?.[idx])
        .filter(Boolean);
      
      await modifyTweet(tweet.id, newContent, remainingMedias || undefined);
      setShowEditModal(false);
      clearError('modifyTweet');
    } catch (error) {
      console.error("Erreur lors de la modification du tweet:", error);
    } finally {
      setIsModifying(false);
    }
  };

  const handleReplyCreated = (reply: Reply) => {
    setReplies([...replies, reply]);
    setShowReplyForm(false);
  };

  return (
    <>
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
          {/* Header with username, time and delete button */}
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
              {currentTweet.updatedAt && (
                <>
                  <span className="text-tweet-meta">·</span>
                  <span className="text-tweet-meta font-medium text-xs">
                    Modifié {formatDate(currentTweet.updatedAt)}
                  </span>
                </>
              )}
            </div>

            {/* Edit and Delete buttons (visible only if owner) */}
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={handleEditClick}
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
                  onClick={handleDeleteClick}
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

          {/* Tweet content */}
          <p className="text-tweet-text text-sm font-medium leading-normal break-words w-full">
            {currentTweet.content}
          </p>

          {/* Media gallery */}
          {currentTweet.medias && currentTweet.medias.length > 0 && (
            <div className="mt-3 space-y-2">
              {currentTweet.medias.map((media, index) => {
                const imageUrl = getImageUrl(media.url);
                
                if (media.type === 'image' && imageUrl) {
                  return (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Tweet media ${index + 1}`}
                      className="w-full h-auto max-h-96 object-cover rounded-lg"
                    />
                  );
                } else if (media.type === 'video' && imageUrl) {
                  return (
                    <video
                      key={index}
                      src={imageUrl}
                      controls
                      className="w-full h-40 sm:h-56 md:h-64 object-cover rounded-lg bg-black"
                    />
                  );
                }
                
                return null;
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-8 pt-3 mt-2">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-tweet-meta hover:bg-blue-50 hover:text-blue-500 rounded-full p-2 transition-colors flex items-center gap-2 text-sm"
              aria-label="Répondre au tweet"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {replies.length > 0 && <span>{replies.length}</span>}
            </button>
            <Heart
              isLiked={isCurrentUserLiked}
              likeCount={currentTweet.likeCount}
              onLike={handleLike}
              onUnlike={handleUnlike}
              isLoading={isLiking}
              disabled={isLiking}
              size="md"
            />
          </div>

          {/* Error display */}
          {likeError && (
            <div className="text-red-500 text-xs mt-2">
              {likeError}
            </div>
          )}
        </div>
      </article>

      {/* Delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Supprimer le tweet"
        message="Êtes-vous sûr de vouloir supprimer ce tweet ? Cette action ne peut pas être annulée."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Edit tweet modal */}
      <EditTweetModal
        isOpen={showEditModal}
        initialContent={currentTweet.content}
        medias={currentTweet.medias}
        isLoading={isModifying}
        onConfirm={handleConfirmEdit}
        onCancel={() => setShowEditModal(false)}
      />

      {/* Reply form and list */}
      {showReplyForm && (
        <ReplyForm tweet={tweet} onReplyCreated={handleReplyCreated} />
      )}
      <ReplyList replies={replies} />
    </>
  );
}


