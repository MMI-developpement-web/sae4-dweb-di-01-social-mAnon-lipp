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
  }, []);

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

