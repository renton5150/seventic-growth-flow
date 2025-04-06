
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/types";

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

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log("Accès refusé: rôle non autorisé");
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
