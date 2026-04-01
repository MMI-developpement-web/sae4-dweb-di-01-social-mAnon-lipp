import { cva, type VariantProps } from "class-variance-authority";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useTweetCard } from "../../hooks/useTweetCard";
import type { Tweet } from "../../lib/api";
import TweetHeader from "../TweetCard/TweetHeader";
import TweetBody from "../TweetCard/TweetBody";
import TweetActions from "../TweetCard/TweetActions";
import TweetModals from "../TweetCard/TweetModals";
import Avatar from "./Avatar";
import ReplyForm from "./ReplyForm";
import ReplyList from "./ReplyList";

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
  hideReplies?: boolean;
  onRetweetCreated?: (retweet: any) => void;
}

export default function TweetCard({
  tweet,
  variant,
  className,
  onDelete,
  hideReplies = false,
  onRetweetCreated,
}: TweetCardProps) {
  const navigate = useNavigate();

  const {
    currentTweet,
    isCurrentUserLiked,
    isOwner,
    likeError,
    blockedMessage,
    showDeleteModal,
    showEditModal,
    showRetweetModal,
    showReplyForm,
    replies,
    isDeleting,
    isModifying,
    isLiking,
    isPinning,
    isRetweeting,
    handleDeleteClick,
    handleEditClick,
    setShowDeleteModal,
    setShowEditModal,
    setShowRetweetModal,
    setShowReplyForm,
    handleConfirmDelete,
    handleConfirmEdit,
    handleLike,
    handleUnlike,
    handlePin,
    handleUnpin,
    handleRetweetModal,
    handleRetweet,
    handleReplyCreated,
  } = useTweetCard({ tweet, onDelete, hideReplies, onRetweetCreated });

  return (
    <>
      <article className={cn(tweetCardVariants({ variant }), className)}>
        {/* Avatar */}
        <button
          onClick={() => navigate(`/profile/${tweet.author.id}`)}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          aria-label={`View ${tweet.author.username}'s profile`}
        >
          <Avatar
            src={tweet.author.profilePicture}
            alt={tweet.author.username}
            size="sm"
          />
        </button>

        {/* Content wrapper */}
        <div className="flex flex-col flex-1 min-w-0">
          <TweetHeader
            tweet={currentTweet}
            isOwner={isOwner || false}
            isPinning={isPinning}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onPin={handlePin}
            onUnpin={handleUnpin}
          />

          <TweetBody tweet={currentTweet} />

          <TweetActions
            tweet={currentTweet}
            isLiked={isCurrentUserLiked}
            isLiking={isLiking}
            isRetweeting={isRetweeting}
            hasRetweeted={currentTweet.userRetweet !== undefined}
            retweetCount={currentTweet.retweetCount || 0}
            hideReplies={hideReplies}
            replyCount={replies.length}
            onReply={() => setShowReplyForm(!showReplyForm)}
            onLike={handleLike}
            onUnlike={handleUnlike}
            onRetweet={handleRetweetModal}
          />

          {/* Error display */}
          {blockedMessage ? (
            <div className="text-red-500 text-xs mt-2">{blockedMessage}</div>
          ) : likeError ? (
            <div className="text-red-500 text-xs mt-2">{likeError}</div>
          ) : null}
        </div>
      </article>

      <TweetModals
        tweet={currentTweet}
        showDeleteModal={showDeleteModal}
        showEditModal={showEditModal}
        showRetweetModal={showRetweetModal}
        isDeleting={isDeleting}
        isModifying={isModifying}
        isRetweeting={isRetweeting}
        onConfirmDelete={handleConfirmDelete}
        onCancelDelete={() => setShowDeleteModal(false)}
        onConfirmEdit={handleConfirmEdit}
        onCancelEdit={() => setShowEditModal(false)}
        onConfirmRetweet={handleRetweet}
        onCancelRetweet={() => setShowRetweetModal(false)}
      />

      {/* Reply form and list */}
      {showReplyForm && !hideReplies && (
        <ReplyForm tweet={tweet} onReplyCreated={handleReplyCreated} />
      )}
      {!hideReplies && <ReplyList replies={replies} />}
    </>
  );
}


