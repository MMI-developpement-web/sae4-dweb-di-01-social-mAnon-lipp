import { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import type { Tweet, Reply } from '../lib/api';
import { fetchTweetById } from '../lib/api';

interface UseTweetCardProps {
  tweet: Tweet;
  onDelete?: (tweetId: number) => void;
  hideReplies?: boolean;
  onRetweetCreated?: (retweet: any) => void;
}

export function useTweetCard({ tweet, onDelete, hideReplies = false, onRetweetCreated }: UseTweetCardProps) {
  const {
    currentUser,
    tweets,
    likeTweet,
    unlikeTweet,
    deleteTweet,
    updateTweet,
    pinTweet: pinTweetAction,
    unpinTweet: unpinTweetAction,
    retweetTweet,
    deleteRetweet,
    hasRetweeted,
    isLiked,
    errors,
    clearError,
  } = useStore();

  // ─────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRetweetModal, setShowRetweetModal] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isRetweeting, setIsRetweeting] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  // Load replies from store
  useEffect(() => {
    const tweetToUse = tweets.get(tweet.id) || tweet;
    if (tweetToUse.replies && tweetToUse.replies.length > 0) {
      setReplies(tweetToUse.replies);
    } else {
      setReplies([]);
    }
  }, [tweet.id, tweets]);

  // Reset blocked message on tweet change
  useEffect(() => {
    setBlockedMessage(null);
  }, [tweet.id]);

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────

  const currentTweet = tweets.get(tweet.id) || tweet;
  const isCurrentUserLiked = isLiked(tweet.id);
  const isOwner = currentUser && currentUser.id === tweet.author.id;
  const likeError = errors['likeTweet'] || errors['unlikeTweet'] || null;

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS - MODALS
  // ─────────────────────────────────────────────────────────────────────────

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS - ASYNC OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTweet(tweet.id);
      setShowDeleteModal(false);
      onDelete?.(tweet.id);
      clearError('deleteTweet');
    } catch (error) {
      console.error('Erreur lors de la suppression du tweet', error);
      setIsDeleting(false);
    }
  };

  const handleConfirmEdit = async (
    newContent: string,
    remainingMediaIndices: number[],
    newMediaFiles: File[]
  ) => {
    setIsModifying(true);
    try {
      const mediaWasModified =
        remainingMediaIndices.length !== (currentTweet.medias?.length ?? 0) ||
        newMediaFiles.length > 0;

      const token = localStorage.getItem('auth_token');
      const API_BASE =
        import.meta.env.VITE_API_URL ?? 'http://localhost:8787/api';

      let updatedTweet;

      if (mediaWasModified) {
        const formData = new FormData();
        formData.append('content', newContent);
        formData.append('mediaModified', 'true');

        remainingMediaIndices.forEach((idx) => {
          formData.append('existingMediaIndices[]', idx.toString());
        });

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

      updateTweet(tweet.id, updatedTweet);
      setShowEditModal(false);
      clearError('modifyTweet');
    } catch (error) {
      console.error('Erreur lors de la modification du tweet', error);
    } finally {
      setIsModifying(false);
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
        setBlockedMessage('Vous avez été bloqué par cet utilisateur');
      } else {
        console.error('Erreur lors du like', error);
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
        setBlockedMessage('Vous avez été bloqué par cet utilisateur');
      } else {
        console.error('Erreur lors du unlike', error);
        setBlockedMessage(null);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handlePin = async () => {
    setIsPinning(true);
    try {
      await pinTweetAction(tweet.id);
      clearError('pinTweet');
    } catch (error) {
      console.error("Erreur lors de l'épinglage du tweet", error);
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
      console.error('Erreur lors du désépinglage du tweet', error);
    } finally {
      setIsPinning(false);
    }
  };

  const handleRetweetModal = () => {
    if (currentUser && hasRetweeted(tweet.id)) {
      const currentTweet = tweets.get(tweet.id) || tweet;
      if (currentTweet.userRetweet) {
        handleDeleteRetweet(currentTweet.userRetweet.id);
      }
    } else {
      setShowRetweetModal(true);
    }
  };

  const handleRetweet = async (content?: string) => {
    setIsRetweeting(true);
    try {
      const retweet = await retweetTweet(tweet.id, content);
      clearError('retweetTweet');

      // Refetch the tweet to ensure counter is up-to-date
      try {
        const updatedTweet = await fetchTweetById(tweet.id);
        updateTweet(tweet.id, updatedTweet);
      } catch (error) {
        console.error('Failed to refetch tweet after retweet', error);
      }

      if (onRetweetCreated) {
        const updatedTweet = tweets.get(tweet.id) || tweet;
        onRetweetCreated({
          ...retweet,
          type: 'retweet',
          originalTweet: updatedTweet,
        });
      }

      setShowRetweetModal(false);
    } catch (error) {
      console.error('Erreur lors du retweet', error);
      throw error;
    } finally {
      setIsRetweeting(false);
    }
  };

  const handleDeleteRetweet = async (retweetId: number) => {
    setIsRetweeting(true);
    try {
      await deleteRetweet(retweetId);
      clearError('deleteRetweet');

      // Refetch the tweet to ensure counter is up-to-date
      try {
        const updatedTweet = await fetchTweetById(tweet.id);
        updateTweet(tweet.id, updatedTweet);
      } catch (error) {
        console.error('Failed to refetch tweet after delete retweet', error);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du retweet', error);
    } finally {
      setIsRetweeting(false);
    }
  };

  const handleReplyCreated = (reply: Reply) => {
    const updatedReplies = [...replies, reply];
    setReplies(updatedReplies);
    updateTweet(tweet.id, { replies: updatedReplies });
    setShowReplyForm(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RETURN PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // State
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
    blockedMessage,

    // Derived state
    currentTweet,
    isCurrentUserLiked,
    isOwner,
    likeError,

    // Modal handlers
    handleDeleteClick,
    handleEditClick,
    setShowDeleteModal,
    setShowEditModal,
    setShowRetweetModal,
    setShowReplyForm,

    // Async handlers
    handleConfirmDelete,
    handleConfirmEdit,
    handleLike,
    handleUnlike,
    handlePin,
    handleUnpin,
    handleRetweetModal,
    handleRetweet,
    handleDeleteRetweet,
    handleReplyCreated,
  };
}
