
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // Si en cours de chargement, afficher un indicateur
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Chargement...</p>
      </div>
    );
  }
  
  // Si l'utilisateur est authentifié
  if (isAuthenticated) {
    // Rediriger les administrateurs vers le tableau de bord admin
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Rediriger les autres utilisateurs vers le tableau de bord standard
    return <Navigate to="/dashboard" replace />;
  }
  
  // Si non authentifié, rediriger vers la page de connexion
  return <Navigate to="/login" replace />;
};

export default Index;
