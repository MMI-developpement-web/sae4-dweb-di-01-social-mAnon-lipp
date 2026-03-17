import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { logout } from "../lib/api";

const LOGO_SRC = "/20260307_1245_Image Generation_remix_01kk41v993esavk7xpb3br8675.png";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-border-muted">
      <div className="flex items-center justify-between px-5 py-3">
        <img
          src={LOGO_SRC}
          alt="Logo"
          className="w-16 h-16 object-contain"
        />
        {/* Mobile logout button */}
          <NavBar mode="desktop" />
        <button
          onClick={handleLogout}
          className="md:hidden p-2 text-text-muted hover:text-tweet-author transition-colors flex items-center justify-center gap-2"
          title="Déconnexion"
          type="button"
          aria-label="Déconnexion"
        >
          <svg className="w-6 h-6 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Déconnecter</span>
        </button>
      </div>
    </header>
  );
}
