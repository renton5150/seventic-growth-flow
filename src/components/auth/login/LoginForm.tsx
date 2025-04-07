
import { useState } from "react";
import { FormToggle } from "./FormToggle";
import { LoginFormContent } from "./LoginFormContent";
import { SignupFormContent } from "./SignupFormContent";
import { DemoAlert } from "./DemoAlert";
import { NetworkStatus } from "./NetworkStatus";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginFormProps {
  showDemoMode?: boolean;
}

export const LoginForm = ({ showDemoMode = false }: LoginFormProps) => {
  const [formMode, setFormMode] = useState<"login" | "signup">("login");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("online");
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { login } = useAuth();

  // Vérification initiale de la connexion au serveur
  const checkServerConnection = async () => {
    try {
      const startTime = Date.now();
      const { error } = await supabase.from("profiles").select("count").limit(1);
      const endTime = Date.now();
      
      console.log(`Temps de réponse du serveur: ${endTime - startTime}ms`);
      
      if (error) {
        console.error("Erreur de connexion:", error);
        setNetworkStatus("offline");
        setError(`Erreur de connexion au serveur: ${error.message}`);
        return false;
      }
      
      setNetworkStatus("online");
      return true;
    } catch (err) {
      console.error("Exception lors de la vérification de la connexion:", err);
      setNetworkStatus("offline");
      setError("Impossible de se connecter au serveur Supabase");
      return false;
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    
    // Vérifier d'abord la connexion au serveur
    const serverAvailable = await checkServerConnection();
    if (!serverAvailable) {
      return false;
    }
    
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
    setError(null);
    setIsSigningUp(true);
    
    // Vérifier d'abord la connexion au serveur
    const serverAvailable = await checkServerConnection();
    if (!serverAvailable) {
      setIsSigningUp(false);
      return false;
    }
    
    try {
      if (!email || !password || !name) {
        setError("Veuillez remplir tous les champs");
        setIsSigningUp(false);
        return false;
      }
      
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        setIsSigningUp(false);
        return false;
      }
      
      console.log("Tentative d'inscription avec:", email);
      
      // Créer un nouveau compte avec email/mot de passe standard
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "sdr"  // Rôle par défaut
          }
        }
      });
      
      if (signUpError) {
        console.error("Erreur lors de l'inscription:", signUpError);
        
        if (signUpError.message.includes("already registered")) {
          setError("Cette adresse email est déjà utilisée");
        } else if (signUpError.message.includes("not allowed")) {
          setError("Domaine email non autorisé ou configuration Supabase incorrecte");
        } else {
          setError(signUpError.message);
        }
        
        setIsSigningUp(false);
        return false;
      }
      
      if (data.user) {
        toast.success("Inscription réussie", {
          description: "Votre compte a été créé. Vous pouvez maintenant vous connecter."
        });
        setFormMode("login");
        setIsSigningUp(false);
        return true;
      } else {
        toast.info("Vérification requise", {
          description: "Veuillez vérifier votre email pour confirmer votre compte."
        });
        setIsSigningUp(false);
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      console.error("Erreur lors de l'inscription:", errorMessage);
      toast.error("Erreur d'inscription", {
        description: errorMessage
      });
      setIsSigningUp(false);
      return false;
    }
  };

  const handleRetry = async () => {
    setError(null);
    setNetworkStatus("checking");
    await checkServerConnection();
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
              isSubmitting={isSigningUp}
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
