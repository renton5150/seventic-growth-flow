
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, UserRole } from "../types/types";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSDR: boolean;
  isGrowth: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Vérifier la session actuelle au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur lors de la vérification de session:", error);
          setLoading(false);
          return;
        }
        
        if (session) {
          // Récupérer les informations utilisateur depuis la base de données
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (userError || !userData) {
            console.error("Impossible de récupérer les données utilisateur:", userError);
            setLoading(false);
            return;
          }
          
          // Adapter les données utilisateur au format attendu par l'application
          const appUser: User = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.name.replace(' ', '+')}&background=7E69AB&color=fff`
          };
          
          setUser(appUser);
        }
      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Configurer l'écouteur de changement d'authentification
    let subscription;
    try {
      const authListener = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            // Récupérer les informations utilisateur depuis la base de données
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (userError || !userData) {
              console.error("Impossible de récupérer les données utilisateur:", userError);
              return;
            }
            
            // Adapter les données utilisateur au format attendu par l'application
            const appUser: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.name.replace(' ', '+')}&background=7E69AB&color=fff`
            };
            
            setUser(appUser);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );
      
      // Safely store the subscription for cleanup
      subscription = authListener.data?.subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
    }
    
    // Nettoyer l'écouteur lors du démontage
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role: UserRole) => user?.role === role;

  // Fonction de connexion avec Supabase
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erreur de connexion:", error.message);
        toast.error("Erreur de connexion", {
          description: error.message
        });
        return false;
      }
      
      if (data.session) {
        // La session est déjà configurée par l'écouteur d'événement onAuthStateChange
        toast.success("Connexion réussie", {
          description: "Bienvenue sur Seventic Growth Flow",
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Erreur inattendue lors de la connexion:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion avec Supabase
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erreur de déconnexion:", error.message);
        return;
      }
      
      setUser(null);
    } catch (error) {
      console.error("Erreur inattendue lors de la déconnexion:", error);
    } finally {
      setLoading(false);
    }
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
        loading
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
