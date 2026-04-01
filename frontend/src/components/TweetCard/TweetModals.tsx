import type { Tweet } from "../../lib/api";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import EditTweetModal from "../EditTweetModal";
import RetweetModal from "../RetweetModal";

interface TweetModalsProps {
  tweet: Tweet;
  showDeleteModal: boolean;
  showEditModal: boolean;
  showRetweetModal: boolean;
  isDeleting: boolean;
  isModifying: boolean;
  isRetweeting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onConfirmEdit: (
    content: string,
    remainingMediaIndices: number[],
    newMediaFiles: File[]
  ) => void;
  onCancelEdit: () => void;
  onConfirmRetweet: (content?: string) => Promise<void>;
  onCancelRetweet: () => void;
}

export default function TweetModals({
  tweet,
  showDeleteModal,
  showEditModal,
  showRetweetModal,
  isDeleting,
  isModifying,
  isRetweeting,
  onConfirmDelete,
  onCancelDelete,
  onConfirmEdit,
  onCancelEdit,
  onConfirmRetweet,
  onCancelRetweet,
}: TweetModalsProps) {
  return (
    <>
      {/* Delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Supprimer le tweet"
        message="Êtes-vous sûr de vouloir supprimer ce tweet ? Cette action ne peut pas être annulée."
        isLoading={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />

      {/* Edit tweet modal */}
      <EditTweetModal
        isOpen={showEditModal}
        initialContent={tweet.content}
        medias={tweet.medias}
        isLoading={isModifying}
        onConfirm={onConfirmEdit}
        onCancel={onCancelEdit}
      />

      {/* Retweet modal */}
      <RetweetModal
        isOpen={showRetweetModal}
        onClose={onCancelRetweet}
        onConfirm={onConfirmRetweet}
        isLoading={isRetweeting}
      />
    </>
  );
}
