
import { useEffect } from "react";
import { LoginForm } from "@/components/auth/login/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Set this to false to disable demo mode
const SHOW_DEMO_MODE = false;

const Login = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting from Login page");
      if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <AuthLayout>
      <LoginForm showDemoMode={SHOW_DEMO_MODE} />
    </AuthLayout>
  );
};

export default Login;
