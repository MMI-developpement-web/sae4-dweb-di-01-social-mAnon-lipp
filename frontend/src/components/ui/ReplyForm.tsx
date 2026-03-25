import { useState } from "react";
import { createReply } from "../../lib/api";
import type { Reply, Tweet } from "../../lib/api";
import Button from "./Button";
import Textarea from "./Textarea";

interface ReplyFormProps {
  tweet: Tweet;
  onReplyCreated?: (reply: Reply) => void;
}

export default function ReplyForm({ tweet, onReplyCreated }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("La réponse ne peut pas être vide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reply = await createReply(tweet.id, content.trim());
      setContent("");
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
      <div className="flex items-center justify-between">
        <span className="text-xs text-tweet-meta">
          {content.length}/280
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
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