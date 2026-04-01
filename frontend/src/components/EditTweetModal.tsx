import { useState, useEffect, useRef } from "react";
import Button from "./ui/Button";
import MentionAutocomplete from "./MentionAutocomplete";
import { getImageUrl } from "../lib/utils";
import type { Tweet } from "../lib/api";

interface MediaPreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface EditTweetModalProps {
  isOpen: boolean;
  initialContent: string;
  medias?: Tweet['medias'];
  isLoading?: boolean;
  onConfirm: (content: string, remainingMediaIndices: number[], newMediaFiles: File[]) => void;
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
  const [newMedias, setNewMedias] = useState<MediaPreview[]>([]);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setRemovedMediaIndices(new Set());
      setNewMedias([]);
      setSuccess(false);
    }
  }, [isOpen, initialContent]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        onCancel();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, onCancel]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        continue;
      }

      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const preview = URL.createObjectURL(file);
      
      setNewMedias((prev) => [...prev, { file, preview, type }]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeNewMedia = (index: number) => {
    setNewMedias((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Revoke the object URL for the removed media
      URL.revokeObjectURL(prev[index].preview);
      return updated;
    });
  };

  const handleConfirm = () => {
    if (content.trim()) {
      const remainingIndices = medias
        ? medias
            .map((_, idx) => idx)
            .filter((idx) => !removedMediaIndices.has(idx))
        : [];
      const newMediaFiles = newMedias.map((m) => m.file);
      setSuccess(true);
      onConfirm(content.trim(), remainingIndices, newMediaFiles);
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

        <div className="relative">
          <textarea
            ref={textareaRef}
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
          <MentionAutocomplete
            textareaValue={content}
            textareaRef={textareaRef}
            onSelectMention={setContent}
          />
        </div>

        <div className={`text-xs mt-2 ${isOverLimit ? "text-red-500" : "text-text-muted"}`}>
          {charCount}/280
        </div>
        {/* Existing Medias section */}
        {medias && medias.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-text mb-3">Médias existants</h3>
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

        {/* New Medias section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text">Ajouter des médias</h3>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-blue-500 hover:text-blue-600 text-xs font-medium"
            >
              Ajouter des fichiers
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            disabled={isLoading}
            className="hidden"
          />
          
          {newMedias.length > 0 && (
            <div className="space-y-2">
              {newMedias.map((media, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded border bg-blue-50 border-blue-200"
                >
                  {media.type === "image" && (
                    <img
                      src={media.preview}
                      alt={`new media ${idx}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  {media.type === "video" && (
                    <video
                      src={media.preview}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <span className="text-xs text-text-muted flex-1">
                    {media.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNewMedia(idx)}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs rounded font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {success && (
          <div className="mt-4 p-3 bg-success/10 border border-success rounded-lg">
            <p className="text-success text-sm font-poppins font-medium text-center">
              Tweet modifié avec succès!
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isLoading || success}
            type="button"
            className={success ? "hidden" : ""}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading || !content.trim() || charCount > 280 || success}
            type="button"
            className={success ? "hidden" : ""}
          >
            {isLoading ? "Modification..." : "Modifier"}
          </Button>
        </div>
      </div>
    </div>
  );
}
