
import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Effet pour redirection après authentification réussie
  useEffect(() => {
    // Ne pas rediriger si l'utilisateur est sur la page de réinitialisation de mot de passe
    const isResetPasswordPage = location.pathname === '/reset-password';
    
    if (isAuthenticated && !isResetPasswordPage) {
      console.log("AuthLayout: Redirection après authentification, isAdmin:", isAdmin);
      const redirectPath = isAdmin ? "/admin/dashboard" : "/dashboard";
      
      // Utiliser window.location.href au lieu de useNavigate
      if (location.pathname !== redirectPath) {
        window.location.href = redirectPath;
        toast.success("Bienvenue");
      }
    }
  }, [isAuthenticated, isAdmin, location.pathname]);

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-seventic-100 to-seventic-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-3xl font-bold text-seventic-500">Seventic Growth Flow</h1>
          <p className="text-seventic-500">Chargement de l'application...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-seventic-500"></div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la page de connexion (ne pas rediriger si l'utilisateur n'est pas authentifié)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-seventic-100 to-seventic-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <h1 className="text-3xl font-bold text-seventic-500">Seventic Growth Flow</h1>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
