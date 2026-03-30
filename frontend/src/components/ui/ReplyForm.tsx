import { useState, useRef } from "react";
import { createReply } from "../../lib/api";
import type { Reply, Tweet } from "../../lib/api";
import Button from "./Button";
import Textarea from "./Textarea";

interface MediaPreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface ReplyFormProps {
  tweet: Tweet;
  onReplyCreated?: (reply: Reply) => void;
}

export default function ReplyForm({ tweet, onReplyCreated }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [medias, setMedias] = useState<MediaPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      setMedias((prev) => [...prev, { file, preview, type }]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMedias((prev) => {
      const newMedias = [...prev];
      URL.revokeObjectURL(newMedias[index].preview);
      newMedias.splice(index, 1);
      return newMedias;
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && medias.length === 0) {
      setError("La réponse ne peut pas être vide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('tweetId', tweet.id.toString());
      
      medias.forEach((media) => {
        formData.append('media[]', media.file);
      });

      const reply = await createReply(tweet.id, content.trim(), medias.map(m => m.file));

      setContent("");
      setMedias([]);
      onReplyCreated?.(reply);
    } catch (err: any) {
      setError(err?.error || "Erreur lors de la création de la réponse");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-l-2 border-tweet-meta pl-4 py-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Répondre au tweet..."
        disabled={isLoading}
        className="mb-2"
        maxLength={280}
      />
      
      {/* Media previews */}
      {medias.length > 0 && (
        <div className="mb-3 space-y-2">
          {medias.map((media, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-blue-50 border-blue-200">
              {media.type === "image" && (
                <img src={media.preview} alt={`media ${idx}`} className="w-10 h-10 object-cover rounded" />
              )}
              {media.type === "video" && (
                <video src={media.preview} className="w-10 h-10 object-cover rounded" />
              )}
              <span className="text-xs text-gray-600 flex-1">{media.file.name}</span>
              <button
                type="button"
                onClick={() => removeMedia(idx)}
                disabled={isLoading}
                className="px-2 py-1 text-xs text-red-500 hover:text-red-600"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-tweet-meta">
            {content.length}/280
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
          >
            + Ajouter média
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            disabled={isLoading}
            className="hidden"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={(!content.trim() && medias.length === 0) || isLoading}
          variant="primary"
          size="sm"
        >
          {isLoading ? "..." : "Répondre"}
        </Button>
      </div>
      {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
    </div>
  );
}