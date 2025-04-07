
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "@/types/types";
import { AuthContextType, AuthState } from "./types";
import { useAuthOperations } from "./useAuthOperations";
import { createAuthSessionHelpers } from "./useAuthSession";

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true
  });
  
  // Setter functions to update the auth state
  const setUser = (user: User | null) => setAuthState(prev => ({ ...prev, user }));
  const setLoading = (loading: boolean) => setAuthState(prev => ({ ...prev, loading }));
  
  // Custom hooks for auth operations and session management
  const { login, logout } = useAuthOperations(setUser, setLoading);
  
  // Initialize auth session
  useEffect(() => {
    console.log("Initialisation de l'authentification");
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    // Safety timeout (3 seconds)
    const safetyTimeout = () => {
      timeoutId = setTimeout(() => {
        if (mounted && authState.loading) {
          console.log("Timeout de chargement atteint, initialisation terminée");
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }, 3000);
    };
    
    // Start timeout immediately
    safetyTimeout();
    
    // Create auth session helpers
    const sessionHelpers = createAuthSessionHelpers(setUser, setLoading);
    
    // Setup auth listener first
    const subscription = sessionHelpers.setupAuthListener();
    
    // Then check for existing session
    sessionHelpers.checkSession();
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Derived properties
  const isAuthenticated = !!authState.user;
  const isAdmin = authState.user?.role === "admin";
  const isSDR = authState.user?.role === "sdr";
  const isGrowth = authState.user?.role === "growth";

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

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
