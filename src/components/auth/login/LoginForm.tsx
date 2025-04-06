
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormToggle } from "./FormToggle";
import { LoginFormContent } from "./LoginFormContent";
import { SignupFormContent } from "./SignupFormContent";
import { DemoAlert } from "./DemoAlert";
import { NetworkStatus } from "./NetworkStatus";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LoginFormProps {
  showDemoMode?: boolean;
}

export const LoginForm = ({ showDemoMode = false }: LoginFormProps) => {
  const [formMode, setFormMode] = useState<"login" | "signup">("login");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("online");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isAdmin, login } = useAuth();

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

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const success = await login(email, password);
      if (!success) {
        setError("Échec de la connexion. Vérifiez vos identifiants.");
        return false;
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      toast.error("Erreur de connexion", {
        description: errorMessage
      });
      return false;
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      // Implement signup logic here
      toast.info("Inscription en cours de développement");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      return false;
    }
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
              onSubmit={handleLogin}
            />
          ) : (
            <SignupFormContent 
              isOffline={networkStatus === "offline"}
              onSubmit={handleSignup}
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
