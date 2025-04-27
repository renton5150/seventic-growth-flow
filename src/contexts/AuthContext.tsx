
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types/types";
import { createAuthSessionHelpers } from "@/contexts/auth/useAuthSession";
import { useAuthOperations } from "@/contexts/auth/useAuthOperations";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGrowth: boolean;
  isSDR: boolean;
  loading: boolean;
  logout: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { checkSession, setupAuthListener } = createAuthSessionHelpers(setUser, setLoading);
  const { logout, login } = useAuthOperations(setUser, setLoading);

  // Initialize authentication state on component mount
  useEffect(() => {
    console.log("Initialisation de l'authentification");
    
    // Check for an existing session first
    checkSession();
    
    // Setup listener for auth state changes
    const authSubscription = setupAuthListener();
    
    // Cleanup subscription when component unmounts
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Derived state
  const isAuthenticated = !!user;
  const isAdmin = !!user && user.role === "admin";
  const isGrowth = !!user && user.role === "growth";
  const isSDR = !!user && user.role === "sdr";

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isGrowth,
    isSDR,
    loading,
    logout,
    login
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
