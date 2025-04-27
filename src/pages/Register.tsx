
import AuthLayout from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/register/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Register = () => {
  const { isAuthenticated, loading } = useAuth();

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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
