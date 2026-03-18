import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import ProfileDropdown from "./ProfileDropdown";
import { fetchCurrentUser, type User } from "../lib/api";

const LOGO_SRC = "/20260307_1245_Image Generation_remix_01kk41v993esavk7xpb3br8675.png";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border-muted">
      <div className="flex items-center justify-between px-5 py-3">
        <img
          src={LOGO_SRC}
          alt="Logo"
          className="w-16 h-16 object-contain"
        />
        {/* Desktop navbar */}
        <NavBar mode="desktop" />
        
        {/* Mobile profile dropdown */}
        {user && <ProfileDropdown user={user} />}
      </div>
    </header>
  );
}
