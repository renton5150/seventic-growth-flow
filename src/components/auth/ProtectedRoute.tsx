
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles = [] }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  // Si toujours en chargement, on ne redirige pas encore
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }
  
  // Redirection si non connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si des rôles sont spécifiés, on vérifie que l'utilisateur a un des rôles requis
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(user.role);
    
    if (!hasAllowedRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Si tout est ok, on affiche le contenu protégé
  return <Outlet />;
};

export default ProtectedRoute;
