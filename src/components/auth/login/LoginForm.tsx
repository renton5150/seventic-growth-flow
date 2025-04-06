
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormToggle } from "./FormToggle";
import { LoginFormContent } from "./LoginFormContent";
import { SignupFormContent } from "./SignupFormContent";
import { DemoAlert } from "./DemoAlert";
import { NetworkStatus } from "./NetworkStatus";
import { useAuth } from "@/contexts/AuthContext";

export const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Si l'utilisateur est déjà connecté, rediriger vers le tableau de bord approprié
  if (user) {
    // Rediriger les administrateurs vers le tableau de bord admin
    if (isAdmin) {
      navigate("/admin/dashboard", { replace: true });
    } else {
      // Rediriger les autres utilisateurs vers le tableau de bord standard
      navigate("/dashboard", { replace: true });
    }
    return null;
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-6">
          <FormToggle isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />
          
          {isLogin ? (
            <LoginFormContent 
              loading={loading} 
              setLoading={setLoading}
              error={error}
              setError={setError}
            />
          ) : (
            <SignupFormContent 
              loading={loading} 
              setLoading={setLoading}
              error={error}
              setError={setError}
            />
          )}
        </div>
      </div>
      
      <DemoAlert />
      <NetworkStatus />
    </div>
  );
};
