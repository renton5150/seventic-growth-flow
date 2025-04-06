
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/login/LoginForm";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Si en cours de chargement, laissez AuthLayout gérer l'affichage
  if (loading) {
    return (
      <AuthLayout>
        <div className="text-center">Vérification de l'authentification...</div>
      </AuthLayout>
    );
  }

  // Si déjà authentifié, rediriger vers la page appropriée
  if (isAuthenticated) {
    const redirectPath = isAdmin ? "/admin/dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // Sinon afficher le formulaire de connexion
  return (
    <AuthLayout>
      <LoginForm showDemoMode={false} />
    </AuthLayout>
  );
};

export default Login;
