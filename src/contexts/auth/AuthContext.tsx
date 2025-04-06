
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, UserRole } from "@/types/types";
import { AuthContextType, AuthState } from "./types";
import { useAuthOperations } from "./useAuthOperations";
import { useAuthSession } from "./useAuthSession";
import { hasRole } from "./authUtils";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true
  });
  
  // Setter functions for user and loading state
  const setUser = (user: User | null) => {
    console.log("État utilisateur mis à jour:", user ? `${user.id} (rôle: ${user.role})` : "déconnecté");
    setAuthState(prev => ({ ...prev, user }));
  };
  
  const setLoading = (loading: boolean) => {
    console.log("État de chargement mis à jour:", loading ? "chargement" : "terminé");
    setAuthState(prev => ({ ...prev, loading }));
  };
  
  // Auth operations (login, logout)
  const { login, logout } = useAuthOperations(setUser, setLoading);
  
  // Initialize and manage auth session
  useAuthSession(setUser, setLoading);

  // Computed properties based on user state
  const isAuthenticated = !!authState.user;
  const isAdmin = authState.user ? hasRole(authState.user, "admin") : false;
  const isSDR = authState.user ? hasRole(authState.user, "sdr") : false;
  const isGrowth = authState.user ? hasRole(authState.user, "growth") : false;
  
  // Log l'état d'authentification lors des changements
  useEffect(() => {
    console.log("État d'authentification mis à jour:", 
      isAuthenticated 
        ? `connecté (Admin: ${isAdmin}, SDR: ${isSDR}, Growth: ${isGrowth})` 
        : "déconnecté");
  }, [isAuthenticated, isAdmin, isSDR, isGrowth]);

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isSDR,
        isGrowth,
        loading: authState.loading
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
