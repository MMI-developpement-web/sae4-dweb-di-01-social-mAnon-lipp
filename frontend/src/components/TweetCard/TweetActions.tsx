import type { Tweet } from "../../lib/api";
import Heart from "../ui/Heart";
import Reply from "../ui/Reply";
import Retweet from "../ui/Retweet";

interface TweetActionsProps {
  tweet: Tweet;
  isLiked: boolean;
  isLiking: boolean;
  isRetweeting: boolean;
  hasRetweeted: boolean;
  retweetCount: number;
  hideReplies: boolean;
  replyCount: number;
  onReply: () => void;
  onLike: () => void;
  onUnlike: () => void;
  onRetweet: () => void;
  isReadOnly?: boolean;
}

export default function TweetActions({
  tweet,
  isLiked,
  isLiking,
  isRetweeting,
  hasRetweeted,
  retweetCount,
  hideReplies,
  replyCount,
  onReply,
  onLike,
  onUnlike,
  onRetweet,
  isReadOnly = false,
}: TweetActionsProps) {
  return (
    <div className="flex justify-end gap-8 pt-3 mt-2">
      <Reply
        isActive={false}
        replyCount={replyCount}
        onReply={onReply}
        disabled={hideReplies || isReadOnly}
        size="md"
      />
      <Retweet
        hasRetweeted={hasRetweeted}
        retweetCount={retweetCount}
        onRetweet={onRetweet}
        isLoading={isRetweeting}
        disabled={isRetweeting}
        size="md"
      />
      <Heart
        isLiked={isLiked}
        likeCount={tweet.likeCount}
        onLike={onLike}
        onUnlike={onUnlike}
        isLoading={isLiking}
        disabled={isLiking}
        size="md"
      />
    </div>
  );
}
