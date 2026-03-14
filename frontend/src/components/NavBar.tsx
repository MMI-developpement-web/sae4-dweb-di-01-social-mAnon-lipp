import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import { logout } from "../lib/api";

type NavBarProps = {
  mode?: "mobile" | "desktop";
};

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function NavBar({ mode = "mobile" }: NavBarProps) {

  const handleLogout = async () => {
    await logout();
  };

  if (mode === "desktop") {
    const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
      cn(
        "text-sm font-medium text-text-muted transition-colors",
        isActive && "text-tweet-author"
      );

    return (
      <nav className="hidden md:flex items-center gap-6">
        <NavLink to="/feed" className={desktopLinkClass}>
          Accueil
        </NavLink>
        <NavLink to="/post" className={desktopLinkClass}>
          Poster
        </NavLink>
        <button onClick={handleLogout} className={desktopLinkClass({ isActive: false })}>
          Déconnexion
        </button>
      </nav>
    );
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn("flex flex-col items-center gap-1 text-xs text-text-muted transition-colors", isActive && "text-tweet-author");

  return (
    <>
      {/* Mobile: bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-border-muted flex items-center justify-around px-4 py-2">
        <NavLink to="/feed" className={linkClass}>
          <HomeIcon />
          <span>Accueil</span>
        </NavLink>
        <NavLink to="/post" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-xs transition-colors", isActive ? "text-tweet-author" : "text-text-muted")}>
          <span className="flex items-center justify-center w-12 h-12 bg-primary rounded-full shadow-[0px_4px_19px_0px_rgba(119,147,65,0.3)] -mt-5">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span>Poster</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className={linkClass({ isActive: false })}
          title="Déconnexion"
          type="button"
        >
          <LogoutIcon />
          <span>Déconnecter</span>
        </button>
      </nav>
    </>
  );
}

