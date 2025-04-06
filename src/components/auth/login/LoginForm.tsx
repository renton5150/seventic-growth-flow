
import { useState } from "react";
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
  const { login } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    
    try {
      console.log("Lancement de la connexion pour:", email);
      
      const success = await login(email, password);
      
      if (success) {
        console.log("Connexion réussie");
        toast.success("Connexion réussie");
        return true;
      } else {
        setError("Échec de la connexion. Vérifiez vos identifiants.");
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Erreur lors de la connexion:", errorMessage);
      toast.error("Erreur de connexion", {
        description: errorMessage
      });
      return false;
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      toast.info("Inscription en cours de développement");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      return false;
    }
  };

  const handleRetry = () => {
    setNetworkStatus("online");
    setError(null);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-6">
          <FormToggle 
            formMode={formMode} 
            onToggle={() => {
              setFormMode(formMode === "login" ? "signup" : "login");
              setError(null);
            }} 
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
      
      {showDemoMode && <DemoAlert showDemoMode={true} />}
      
      <NetworkStatus 
        status={networkStatus}
        error={error}
        onRetry={handleRetry}
      />
    </div>
  );
};
