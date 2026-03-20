import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "./ui/Avatar";
import { logout, type User } from "../lib/api";

interface ProfileDropdownProps {
  user: User;
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    navigate(`/profile/${user.id}`);
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    navigate("/settings");
    setShowDropdown(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-text-muted hover:text-tweet-author transition-colors flex items-center justify-center"
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
            className="w-full text-left px-4 py-2 text-text hover:bg-background transition-colors text-sm"
          >
            Mon profil
          </button>
          <button
            onClick={handleSettingsClick}
            className="w-full text-left px-4 py-2 text-text hover:bg-background transition-colors text-sm"
          >
            Paramètres
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
  );
}
