import { redirect, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/ui/Button";
import PostForm from "../components/PostForm";

export async function loader() {
  const token = localStorage.getItem("auth_token");
  if (!token) return redirect("/login");
  return null;
}

export default function Post() {
  const navigate = useNavigate();

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
        <PostForm />
      </div>
    </div>
  );
}
