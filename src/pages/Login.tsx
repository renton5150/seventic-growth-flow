
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/auth";
import { LoginForm } from "@/components/auth/login/LoginForm";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Afficher un indicateur de chargement plus léger
  if (loading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-seventic-500 mb-4"></div>
          <div className="text-center">Vérification en cours...</div>
        </div>
      </AuthLayout>
    );
  }

  // Rediriger si déjà authentifié
  if (isAuthenticated) {
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
