
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormToggle } from "./FormToggle";
import { LoginFormContent } from "./LoginFormContent";
import { SignupFormContent } from "./SignupFormContent";
import { DemoAlert } from "./DemoAlert";
import { NetworkStatus } from "./NetworkStatus";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  showDemoMode?: boolean;
}

export const LoginForm = ({ showDemoMode = false }: LoginFormProps) => {
  const [formMode, setFormMode] = useState<"login" | "signup">("login");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("checking");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();

  // Vérifier la connexion à Supabase au chargement
  useState(() => {
    const checkConnection = async () => {
      try {
        console.log("Vérification de la connexion...");
        const start = Date.now();
        const { error } = await supabase.from("profiles").select("id").limit(1);
        const elapsed = Date.now() - start;
        
        if (error) {
          console.error("Échec du test de connexion à Supabase:", error);
          setNetworkStatus("offline");
          setError(`Problème de connexion au serveur: ${error.message}`);
        } else {
          console.log(`Connexion à Supabase OK (${elapsed}ms)`);
          setNetworkStatus("online");
          setError(null);
        }
      } catch (err) {
        console.error("Erreur lors du test de connexion:", err);
        setNetworkStatus("offline");
        setError("Impossible de se connecter au serveur. Veuillez réessayer plus tard.");
      }
    };
    
    checkConnection();
  });

  const handleRetry = () => {
    setNetworkStatus("checking");
    setTimeout(() => {
      setNetworkStatus("online");
      setError(null);
    }, 1000);
  };

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    if (networkStatus === "offline") {
      setError("Vous êtes hors ligne. Impossible de se connecter.");
      return false;
    }
    
    try {
      console.log("Traitement de la connexion pour:", email);
      const success = await login(email, password);
      
      if (success) {
        console.log("Connexion réussie, redirection...");
        toast.success("Connexion réussie");
        navigate(isAdmin ? "/admin/dashboard" : "/dashboard", { replace: true });
        return true;
      } else {
        setError("Échec de la connexion. Vérifiez vos identifiants.");
        return false;
      }
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
      // Logique d'inscription
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
