import NavBar from "./NavBar";
import ProfileDropdown from "./ProfileDropdown";
import { useCurrentUser } from "../store/StoreContext";
import logo from "../assets/20260307_1245_Image Generation_remix_01kk41v993esavk7xpb3br8675.png";

export default function Header() {
  const currentUser = useCurrentUser();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border-muted">
      <div className="flex items-center justify-between px-5 py-3">
        <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
        {/* Desktop navbar */}
        <NavBar mode="desktop" />
        
        {/* Mobile profile dropdown */}
        {currentUser && <ProfileDropdown user={currentUser} />}
      </div>
    </header>
  );
}
