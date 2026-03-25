import { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, type User } from "../lib/api";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        // If token is invalid, clear it
        localStorage.removeItem("auth_token");
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
   // Listen for changes in localStorage (e.g., new login in another tab or after navigation)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        if (e.newValue) {
          // Token was set - load the user
          loadUser();
        } else {
          // Token was removed - clear the user
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
// Listen for custom event (same-tab token changes, e.g., after login)
    const handleAuthTokenChanged = () => {
      loadUser();
    };
    
    window.addEventListener("authTokenChanged", handleAuthTokenChanged);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authTokenChanged", handleAuthTokenChanged);
    };  }, []);


  return (
    <AuthContext.Provider value={{ currentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

