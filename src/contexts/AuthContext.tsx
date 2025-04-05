
import { createContext, useContext, useState, ReactNode } from "react";
import { User, UserRole } from "../types/types";
import { getCurrentUser } from "../data/mockData";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSDR: boolean;
  isGrowth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Check if user has a specific role
  const hasRole = (role: UserRole) => user?.role === role;

  const login = async (email: string, password: string) => {
    try {
      // In a real app, we would make an API call here
      // For now, we'll use mock data
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Simple validation for demo purposes
      if (email && password) {
        // Get mock user
        const mockedUser = getCurrentUser();
        setUser(mockedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: hasRole("admin"),
        isSDR: hasRole("sdr"),
        isGrowth: hasRole("growth"),
      }}
    >
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
