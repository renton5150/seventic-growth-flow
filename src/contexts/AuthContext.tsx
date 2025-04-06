
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, UserRole } from "../types/types";
import { supabase } from "@/integrations/supabase/client";
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
            .from('profiles')
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
            email: userData.email || session.user.email || '',
            name: userData.name || 'Utilisateur',
            role: userData.role as UserRole || 'sdr',
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.name?.replace(' ', '+') || 'User'}&background=7E69AB&color=fff`
          };
          
          console.log("Utilisateur authentifié chargé:", appUser);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Événement d'authentification:", event, session ? "session active" : "pas de session");
        
        if (event === 'SIGNED_IN' && session) {
          // Récupérer les informations utilisateur depuis la base de données
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
              
          if (userError) {
            console.error("Impossible de récupérer les données utilisateur:", userError);
            return;
          }
          
          if (!userData) {
            // L'utilisateur n'a pas encore de profil, on en crée un
            console.log("Création d'un nouveau profil utilisateur pour:", session.user.id);
            
            const newUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Nouvel utilisateur',
              role: 'sdr' as UserRole
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newUser);
              
            if (insertError) {
              console.error("Impossible de créer le profil utilisateur:", insertError);
              return;
            }
            
            // Adapter les données utilisateur au format attendu par l'application
            const appUser: User = {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
              avatar: `https://ui-avatars.com/api/?name=${newUser.name.replace(' ', '+')}&background=7E69AB&color=fff`
            };
            
            console.log("Nouveau profil utilisateur créé:", appUser);
            setUser(appUser);
          } else {
            // Adapter les données utilisateur au format attendu par l'application
            const appUser: User = {
              id: userData.id,
              email: userData.email || session.user.email || '',
              name: userData.name || 'Utilisateur',
              role: userData.role as UserRole || 'sdr',
              avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.name?.replace(' ', '+') || 'User'}&background=7E69AB&color=fff`
            };
            
            console.log("Utilisateur authentifié:", appUser);
            setUser(appUser);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Utilisateur déconnecté");
          setUser(null);
        }
      }
    );
    
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
      
      // Connexion avec Supabase
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
      
      // Déconnexion avec Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erreur de déconnexion:", error.message);
        return;
      }
      
      setUser(null);
      toast.success("Déconnexion réussie");
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
