import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { UserRole } from "@/types/types";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("ProtectedRoute - Vérification pour", location.pathname);
    console.log("Utilisateur authentifié:", isAuthenticated);
    console.log("Rôles autorisés:", allowedRoles);
    console.log("Rôle utilisateur:", user?.role);
    console.log("Accès autorisé:", isAuthenticated && (!allowedRoles || (user && allowedRoles.includes(user.role))));
  }, [isAuthenticated, user, allowedRoles, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <p className="mb-4">Vérification d'authentification en cours...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-seventic-500"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Accès refusé: utilisateur non authentifié");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log("Accès refusé: rôle non autorisé");
    toast.error("Accès refusé. Vous n'avez pas les autorisations nécessaires.");
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
