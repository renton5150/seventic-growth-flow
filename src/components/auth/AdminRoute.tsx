
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminRoute = () => {
  const { user, isAdmin, loading } = useAuth();
  
  // Si toujours en chargement, on ne redirige pas encore
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }
  
  // Redirection si non connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirection si connecté mais pas admin
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Si tout est ok, on affiche le contenu protégé
  return <Outlet />;
};

export default AdminRoute;
