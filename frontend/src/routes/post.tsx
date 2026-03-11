import { useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import { postTweet } from "../lib/api";

const MAX = 280;

export async function loader() {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");
  return null;
}

export default function Post() {
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
      navigate("/feed");
    } catch {
      setError("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="px-5 pt-[50px]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-[21px]">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retour"
          >
            <svg className="w-[13px] h-5" viewBox="0 0 13 20" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 2L2 10l9 8" />
            </svg>
          </Button>
          <p className="text-[14px] font-medium font-poppins text-[#0f1419]">Nouveau post</p>
          <div className="w-[13px]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            variant={isOver ? "error" : "post"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Partagez votre éclat..."
            maxLength={MAX + 1}
          />

          <div className="flex items-center justify-between">
            <span className={`text-[12px] font-poppins font-medium ${isOver ? "text-danger" : "text-tweet-author"}`}>
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
        </form>
      </div>
    </div>
  );
}
