
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormToggle } from "./FormToggle";
import { LoginFormContent } from "./LoginFormContent";
import { SignupFormContent } from "./SignupFormContent";
import { DemoAlert } from "./DemoAlert";
import { NetworkStatus } from "./NetworkStatus";
import { useAuth } from "@/contexts/AuthContext";

interface LoginFormProps {
  showDemoMode?: boolean;
}

export const LoginForm = ({ showDemoMode = false }: LoginFormProps) => {
  const [formMode, setFormMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("online");
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

  const handleRetry = () => {
    setNetworkStatus("checking");
    // Simulate checking the network
    setTimeout(() => {
      setNetworkStatus("online");
      setError(null);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-6">
          <FormToggle 
            formMode={formMode} 
            onToggle={() => setFormMode(formMode === "login" ? "signup" : "login")} 
          />
          
          {formMode === "login" ? (
            <LoginFormContent 
              isOffline={networkStatus === "offline"}
              onSubmit={async (email, password) => {
                const { login } = useAuth();
                setLoading(true);
                try {
                  const result = await login(email, password);
                  return result;
                } catch (err) {
                  return false;
                } finally {
                  setLoading(false);
                }
              }}
            />
          ) : (
            <SignupFormContent 
              isOffline={networkStatus === "offline"}
              onSubmit={async (email, password, name) => {
                setLoading(true);
                try {
                  // Implement signup logic
                  return true;
                } catch (err) {
                  return false;
                } finally {
                  setLoading(false);
                }
              }}
            />
          )}
        </div>
      </div>
      
      <DemoAlert showDemoMode={showDemoMode} />
      <NetworkStatus 
        status={networkStatus}
        error={error}
        onRetry={handleRetry}
      />
    </div>
  );
};
