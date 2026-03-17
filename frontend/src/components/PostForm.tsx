import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import Textarea from "./ui/Textarea";
import { postTweet } from "../lib/api";

const MAX = 280;

interface PostFormProps {
  onSuccess?: () => void;
}

export default function PostForm({ onSuccess }: PostFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const remaining = MAX - content.length;
  const isOver = remaining < 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isOver) return;
    setLoading(true);
    setError(null);
    try {
      await postTweet(content.trim());
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/feed");
      }
    } catch {
      setError("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        variant={isOver ? "error" : "post"}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Partagez votre éclat..."
        maxLength={MAX + 1}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-poppins font-medium ${isOver ? "text-danger" : "text-tweet-author"}`}>
            {content.length} / {MAX}
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
            Publier
          </Button>
        </div>
      </div>
    </form>
  );
}
