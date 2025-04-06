
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/login/LoginForm";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Login = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Redirection automatique si l'utilisateur est déjà authentifié
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log("Utilisateur authentifié, redirection...");
      const redirectPath = isAdmin ? "/admin/dashboard" : "/dashboard";
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-seventic-500 mb-4"></div>
          <div className="text-center">Vérification de votre authentification...</div>
          <div className="text-sm text-muted-foreground mt-2">
            Cela prend plus de temps que prévu? 
            <button 
              onClick={() => window.location.reload()} 
              className="text-seventic-500 hover:underline ml-1"
            >
              Actualiser la page
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (isAuthenticated) {
    console.log("Redirection effectuée");
    const redirectPath = isAdmin ? "/admin/dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <AuthLayout>
      <LoginForm showDemoMode={true} />
    </AuthLayout>
  );
};

export default Login;
