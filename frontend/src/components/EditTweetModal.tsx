import { useState, useEffect } from "react";
import Button from "./ui/Button";
import { getImageUrl } from "../lib/utils";
import type { Tweet } from "../lib/api";

interface EditTweetModalProps {
  isOpen: boolean;
  initialContent: string;
  medias?: Tweet['medias'];
  isLoading?: boolean;
  onConfirm: (content: string, remainingMediaIndices: number[]) => void;
  onCancel: () => void;
}

export default function EditTweetModal({
  isOpen,
  initialContent,
  medias = [],
  isLoading = false,
  onConfirm,
  onCancel,
}: EditTweetModalProps) {
  const [content, setContent] = useState(initialContent);
  const [removedMediaIndices, setRemovedMediaIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setRemovedMediaIndices(new Set());
    }
  }, [isOpen, initialContent]);

  const handleConfirm = () => {
    if (content.trim()) {
      const remainingIndices = medias
        ? medias
            .map((_, idx) => idx)
            .filter((idx) => !removedMediaIndices.has(idx))
        : [];
      onConfirm(content.trim(), remainingIndices);
    }
  };

  const toggleRemoveMedia = (index: number) => {
    setRemovedMediaIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  const charCount = content.length;
  const isOverLimit = charCount > 280;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg p-6 max-w-md mx-4 shadow-lg max-h-96 overflow-y-auto">
        <h2 className="text-lg font-bold text-text mb-4">Modifier le tweet</h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 ${
            isOverLimit
              ? "border-red-400 focus:ring-red-300 text-red-700"
              : "border-gray-300 focus:ring-blue-300"
          }`}
          rows={4}
          placeholder="Quoi de neuf ?!"
        />

        <div className={`text-xs mt-2 ${isOverLimit ? "text-red-500" : "text-text-muted"}`}>
          {charCount}/280
        </div>

        {/* Medias section */}
        {medias && medias.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-text mb-3">Médias</h3>
            <div className="space-y-2">
              {medias.map((media, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded border ${
                    removedMediaIndices.has(idx)
                      ? "bg-red-50 border-red-200 opacity-50"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {media.type === "image" && getImageUrl(media.url) && (
                    <img
                      src={getImageUrl(media.url)}
                      alt={`media ${idx}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  {media.type === "video" && getImageUrl(media.url) && (
                    <video
                      src={getImageUrl(media.url)}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <span className="text-xs text-text-muted flex-1">
                    {removedMediaIndices.has(idx) ? "À supprimer" : media.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRemoveMedia(idx)}
                    disabled={isLoading}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                      removedMediaIndices.has(idx)
                        ? "bg-gray-300 text-gray-600 hover:bg-gray-400"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    {removedMediaIndices.has(idx) ? "Garder" : "Supprimer"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            type="button"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading || !content.trim() || isOverLimit}
            type="button"
          >
            {isLoading ? "Modification..." : "Modifier"}
          </Button>
        </div>
      </div>
    </div>
  );
}
