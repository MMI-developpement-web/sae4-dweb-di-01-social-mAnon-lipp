import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Avatar from "./ui/Avatar";
import { logout, fetchCurrentUser, type User } from "../lib/api";

const LOGO_SRC = "/20260307_1245_Image Generation_remix_01kk41v993esavk7xpb3br8675.png";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.id}`);
      setShowDropdown(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border-muted">
      <div className="flex items-center justify-between px-5 py-3">
        <img
          src={LOGO_SRC}
          alt="Logo"
          className="w-16 h-16 object-contain"
        />
        {/* Mobile logout button */}
        <NavBar mode="desktop" />
        
        {/* Profile Avatar with Dropdown */}
        {user && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="md:hidden p-2 text-text-muted hover:text-tweet-author transition-colors flex items-center justify-center"
              title={user.username}
              type="button"
              aria-label="Profile menu"
            >
              <Avatar
                src={user.profilePicture}
                alt={user.username}
                size="sm"
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-border-muted rounded-lg shadow-lg py-2 z-20">
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-text-primary hover:bg-background transition-colors text-sm"
                >
                  Mon profil
                </button>
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-background transition-colors text-sm"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
