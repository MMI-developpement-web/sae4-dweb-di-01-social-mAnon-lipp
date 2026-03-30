import { cva, type VariantProps } from "class-variance-authority";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { getImageUrl } from "../../lib/utils";
// removed renderTweetContent import — using stored content directly
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
    updateTweet,
    pinTweet: pinTweetAction,
    unpinTweet: unpinTweetAction,
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
  const [isPinning, setIsPinning] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  // Load replies from tweet when component mounts or tweet changes
  useEffect(() => {
    // Get currentTweet first, then extract replies
    const tweetToUse = tweets.get(tweet.id) || tweet;
    if (tweetToUse.replies && tweetToUse.replies.length > 0) {
      setReplies(tweetToUse.replies);
    } else {
      setReplies([]);
    }
  }, [tweet.id, tweets]);

  useEffect(() => {
    setBlockedMessage(null);
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
      setBlockedMessage(null);
    } catch (error: any) {
      if (error?.status === 403) {
        setBlockedMessage("Vous avez été bloqué par cet utilisateur");
      } else {
        console.error("Erreur lors du like:", error);
        setBlockedMessage(null);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleUnlike = async () => {
    setIsLiking(true);
    try {
      await unlikeTweet(tweet.id);
      clearError('unlikeTweet');
      setBlockedMessage(null);
    } catch (error: any) {
      if (error?.status === 403) {
        setBlockedMessage("Vous avez été bloqué par cet utilisateur");
      } else {
        console.error("Erreur lors du unlike:", error);
        setBlockedMessage(null);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleConfirmEdit = async (newContent: string, remainingMediaIndices: number[], newMediaFiles: File[]) => {
    setIsModifying(true);
    try {
      // Check if media was modified (either some indices removed or new files added)
      const mediaWasModified = remainingMediaIndices.length !== (currentTweet.medias?.length ?? 0) || newMediaFiles.length > 0;
      
      const token = localStorage.getItem('auth_token');
      const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api";
      
      let updatedTweet;
      
      if (mediaWasModified) {
        // Use FormData when media was modified
        const formData = new FormData();
        formData.append('content', newContent);
        formData.append('mediaModified', 'true');
        
        // Add remaining existing media indices (even if empty)
        remainingMediaIndices.forEach((idx) => {
          formData.append('existingMediaIndices[]', idx.toString());
        });
        
        // Add new media files (if any)
        newMediaFiles.forEach((file) => {
          formData.append('media[]', file);
        });
        
        const response = await fetch(`${API_BASE}/tweets/${tweet.id}`, {
          method: 'PUT',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la modification du tweet');
        }

        updatedTweet = await response.json();
      } else {
        // No media modification, use JSON
        const response = await fetch(`${API_BASE}/tweets/${tweet.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: newContent }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la modification du tweet');
        }

        updatedTweet = await response.json();
      }

      // Update store immediately with server response
      updateTweet(tweet.id, updatedTweet);
      setShowEditModal(false);
      clearError('modifyTweet');
    } catch (error) {
      console.error("Erreur lors de la modification du tweet:", error);
    } finally {
      setIsModifying(false);
    }
  };

  const handleReplyCreated = (reply: Reply) => {
    const updatedReplies = [...replies, reply];
    setReplies(updatedReplies);
    // Also update the store so replies persist when navigating away
    updateTweet(tweet.id, { replies: updatedReplies });
    setShowReplyForm(false);
  };

  const handlePin = async () => {
    setIsPinning(true);
    try {
      await pinTweetAction(tweet.id);
      clearError('pinTweet');
    } catch (error) {
      console.error("Erreur lors de l'épinglage du tweet:", error);
    } finally {
      setIsPinning(false);
    }
  };

  const handleUnpin = async () => {
    setIsPinning(true);
    try {
      await unpinTweetAction(tweet.id);
      clearError('unpinTweet');
    } catch (error) {
      console.error("Erreur lors du désépinglage du tweet:", error);
    } finally {
      setIsPinning(false);
    }
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
                {/* Pin/Unpin button */}
                <button
                  onClick={currentTweet.isPinned ? handleUnpin : handlePin}
                  disabled={isPinning}
                  className={`rounded-full p-2 transition-colors flex-shrink-0 ${
                    currentTweet.isPinned
                      ? "text-yellow-500 hover:bg-yellow-50"
                      : "text-tweet-meta hover:bg-yellow-50 hover:text-yellow-500"
                  }`}
                  aria-label={currentTweet.isPinned ? "Désépingler le tweet" : "Épingler le tweet"}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill={currentTweet.isPinned ? "currentColor" : "none"}
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
          {blockedMessage ? (
            <div className="text-red-500 text-xs mt-2">
              {blockedMessage}
            </div>
          ) : likeError ? (
            <div className="text-red-500 text-xs mt-2">
              {likeError}
            </div>
          ) : null}
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


