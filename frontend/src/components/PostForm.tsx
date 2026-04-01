import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import Textarea from "./ui/Textarea";
import MentionAutocomplete from "./MentionAutocomplete";
import { postTweetWithMedia } from "../lib/api";
import { cn } from "../lib/utils";

const MAX = 280;

interface PostFormProps {
  onSuccess?: () => void;
}

interface MediaPreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function PostForm({ onSuccess }: PostFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [medias, setMedias] = useState<MediaPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const remaining = MAX - content.length;
  const isOver = remaining < 0;

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Les fichiers doivent être des images ou des vidéos');
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('Les fichiers ne doivent pas dépasser 50MB');
        return;
      }

      const type = file.type.startsWith('image/') ? 'image' : 'video';
      const preview = URL.createObjectURL(file);
      
      setMedias((prev) => [...prev, { file, preview, type }]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  const removeMedia = (index: number) => {
    setMedias((prev) => {
      const newMedias = [...prev];
      URL.revokeObjectURL(newMedias[index].preview);
      newMedias.splice(index, 1);
      return newMedias;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isOver) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // If we have media files, use FormData
      if (medias.length > 0) {
        const formData = new FormData();
        formData.append('content', content.trim());
        medias.forEach((media) => {
          formData.append('media[]', media.file);
        });
        await postTweetWithMedia(formData);
      } else {
        // Otherwise use JSON
        const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'}/tweets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          body: JSON.stringify({ content: content.trim() }),
        });
        
        if (!response.ok) throw new Error('Failed to create tweet');
      }

      // Clear form
      setContent('');
      setMedias([]);

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/feed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue, veuillez réessayer.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          variant={isOver ? "error" : "post"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partagez votre éclat..."
          maxLength={MAX + 1}
        />
        
        <MentionAutocomplete
          textareaValue={content}
          textareaRef={textareaRef}
          onSelectMention={setContent}
        />
        
        {/* Media button - positioned in bottom right corner */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="absolute bottom-3 left-3 p-2 hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
          aria-label="Add media"
        >
          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaSelect}
        disabled={loading}
        className="hidden"
        aria-label="Media file input"
      />

      {/* Media previews */}
      {medias.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {medias.map((media, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden bg-gray-100">
              {media.type === 'image' ? (
                <img
                  src={media.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <video
                  src={media.preview}
                  className="w-full h-24 object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removeMedia(index)}
                disabled={loading}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity disabled:opacity-50"
                aria-label="Remove media"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Character counter and errors */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-xs font-poppins font-medium",
            isOver ? "text-danger" : "text-tweet-author"
          )}>
            {content.length} / {MAX}
          </span>
          <span className="text-xs text-text-muted font-poppins">
            {medias.length} fichier(s)
          </span>
        </div>

        {isOver && (
          <p className="text-danger text-xs font-poppins">Limite de {MAX} caractères atteinte.</p>
        )}

        {error && (
          <p className="text-danger text-xs font-poppins">{error}</p>
        )}

        <div className="flex justify-end mt-1">
          <Button
            type="submit"
            size="xs"
            disabled={loading || isOver || !content.trim()}
          >
            {loading ? "Publication..." : "Publier"}
          </Button>
        </div>
      </div>
    </form>
  );
}
