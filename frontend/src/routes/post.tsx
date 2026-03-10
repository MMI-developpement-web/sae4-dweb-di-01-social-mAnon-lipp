import { useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import Header from "../components/Header";
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
          <button onClick={() => navigate(-1)} className="text-text" aria-label="Retour">
            <svg className="w-[13px] h-5" viewBox="0 0 13 20" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 2L2 10l9 8" />
            </svg>
          </button>
          <p className="text-[14px] font-medium font-poppins text-[#0f1419]">Nouveau post</p>
          <div className="w-[13px]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Partagez votre éclat..."
            className="w-full h-[156px] rounded-[9px] border-3 border-primary/60 px-[15px] py-[12px] text-[14px] font-poppins font-medium text-text placeholder:text-border-muted resize-none focus:outline-none focus:border-primary"
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
            <button
              type="submit"
              disabled={loading || isOver || !content.trim()}
              className="bg-primary text-white text-[16px] font-poppins font-medium rounded-[10px] px-6 h-[33px] shadow-[0px_4px_19px_0px_rgba(119,147,65,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
