import { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import type { Tweet, Reply } from '../lib/api';
import { fetchTweetById } from '../lib/api';
import { handleBlockedError } from '../lib/blocked-error-handler';

interface UseTweetCardProps {
  tweet: Tweet;
  onDelete?: (tweetId: number) => void;
  onRetweetCreated?: (retweet: any) => void;
}

export function useTweetCard({ tweet, onDelete, onRetweetCreated }: UseTweetCardProps) {
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

  // Consolidated modal states
  const [modals, setModals] = useState({
    delete: false,
    edit: false,
    retweet: false,
    reply: false,
  });

  // Consolidated loading states
  const [loading, setLoading] = useState({
    deleting: false,
    modifying: false,
    liking: false,
    pinning: false,
    retweeting: false,
  });

  // Data states
  const [replies, setReplies] = useState<Reply[]>([]);
  const [retweetCount, setRetweetCount] = useState<number>(tweet.retweetCount || 0);
  const [hasUserRetweeted, setHasUserRetweeted] = useState<boolean>(tweet.userRetweet !== undefined);
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
  }, [tweet, tweets]);

  // Load retweet count and user retweet status from store
  useEffect(() => {
    const tweetToUse = tweets.get(tweet.id) || tweet;
    setRetweetCount(tweetToUse.retweetCount || 0);
    setHasUserRetweeted(tweetToUse.userRetweet !== undefined);
  }, [tweet, tweets]);

  // Reset blocked message on tweet change
  useEffect(() => {
    setBlockedMessage(null);
  }, [tweet.id]);

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL STATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const closeModal = (modal: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modal]: false }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────

  const currentTweet = tweets.get(tweet.id) || tweet;
  const isCurrentUserLiked = isLiked(tweet.id);
  const isOwner = currentUser && currentUser.id === tweet.author.id;
  const likeError = errors['likeTweet'] || errors['unlikeTweet'] || null;
  const isAuthorReadOnly = tweet.author.readOnly === true;

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS - MODALS
  // ─────────────────────────────────────────────────────────────────────────

  const handleDeleteClick = () => {
    setModals(prev => ({ ...prev, delete: true }));
  };

  const handleEditClick = () => {
    setModals(prev => ({ ...prev, edit: true }));
  };

  const handleReplyClick = () => {
    if (isAuthorReadOnly) {
      setBlockedMessage(`${tweet.author.username} n'autorise pas les réponses sur ce compte.`);
      return;
    }
    setModals(prev => ({ ...prev, reply: !prev.reply }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS - ASYNC OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    setLoading(prev => ({ ...prev, deleting: true }));
    try {
      await deleteTweet(tweet.id);
      closeModal('delete');
      onDelete?.(tweet.id);
      clearError('deleteTweet');
    } catch (error) {
      console.error('Erreur lors de la suppression du tweet', error);
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  };

  const handleConfirmEdit = async (
    newContent: string,
    remainingMediaIndices: number[],
    newMediaFiles: File[]
  ) => {
    setLoading(prev => ({ ...prev, modifying: true }));
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
      closeModal('edit');
      clearError('modifyTweet');
    } catch (error) {
      console.error('Erreur lors de la modification du tweet', error);
    } finally {
      setLoading(prev => ({ ...prev, modifying: false }));
    }
  };

  const handleLike = async () => {
    setLoading(prev => ({ ...prev, liking: true }));
    try {
      await likeTweet(tweet.id);
      clearError('likeTweet');
      setBlockedMessage(null);
    } catch (error: any) {
      const { isBlocked, message } = handleBlockedError(error);
      if (isBlocked) {
        setBlockedMessage(message);
      } else {
        console.error('Erreur lors du like', error);
        setBlockedMessage(null);
      }
    } finally {
      setLoading(prev => ({ ...prev, liking: false }));
    }
  };

  const handleUnlike = async () => {
    setLoading(prev => ({ ...prev, liking: true }));
    try {
      await unlikeTweet(tweet.id);
      clearError('unlikeTweet');
      setBlockedMessage(null);
    } catch (error: any) {
      const { isBlocked, message } = handleBlockedError(error);
      if (isBlocked) {
        setBlockedMessage(message);
      } else {
        console.error('Erreur lors du unlike', error);
        setBlockedMessage(null);
      }
    } finally {
      setLoading(prev => ({ ...prev, liking: false }));
    }
  };

  const handlePin = async () => {
    setLoading(prev => ({ ...prev, pinning: true }));
    try {
      await pinTweetAction(tweet.id);
      clearError('pinTweet');
    } catch (error) {
      console.error("Erreur lors de l'épinglage du tweet", error);
    } finally {
      setLoading(prev => ({ ...prev, pinning: false }));
    }
  };

  const handleUnpin = async () => {
    setLoading(prev => ({ ...prev, pinning: true }));
    try {
      await unpinTweetAction(tweet.id);
      clearError('unpinTweet');
    } catch (error) {
      console.error('Erreur lors du désépinglage du tweet', error);
    } finally {
      setLoading(prev => ({ ...prev, pinning: false }));
    }
  };

  const handleRetweetModal = () => {
    if (currentUser && hasRetweeted(tweet.id)) {
      const currentTweet = tweets.get(tweet.id) || tweet;
      if (currentTweet.userRetweet) {
        handleDeleteRetweet(currentTweet.userRetweet.id);
      }
    } else {
      setModals(prev => ({ ...prev, retweet: true }));
    }
  };

  const handleRetweet = async (content?: string) => {
    setLoading(prev => ({ ...prev, retweeting: true }));
    try {
      const retweet = await retweetTweet(tweet.id, content);
      clearError('retweetTweet');

      // The store already updates via onUpdateTweet in relationshipsSlice,
      // no need to refetch the tweet

      if (onRetweetCreated) {
        const updatedTweet = tweets.get(tweet.id) || tweet;
        onRetweetCreated({
          ...retweet,
          type: 'retweet',
          originalTweet: updatedTweet,
        });
      }

      closeModal('retweet');
    } catch (error) {
      console.error('Erreur lors du retweet', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, retweeting: false }));
    }
  };

  const handleDeleteRetweet = async (retweetId: number) => {
    setLoading(prev => ({ ...prev, retweeting: true }));
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
      setLoading(prev => ({ ...prev, retweeting: false }));
    }
  };

  const handleReplyCreated = (reply: Reply) => {
    const updatedReplies = [...replies, reply];
    setReplies(updatedReplies);
    updateTweet(tweet.id, { replies: updatedReplies });
    closeModal('reply');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RETURN PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Modal states
    modals,
    closeModal,

    // Loading states
    loading,

    // Data states
    replies,
    retweetCount,
    hasUserRetweeted,
    blockedMessage,

    // Derived state
    currentTweet,
    isCurrentUserLiked,
    isOwner,
    likeError,
    isAuthorReadOnly,

    // Modal handlers
    handleDeleteClick,
    handleEditClick,
    handleReplyClick,

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
