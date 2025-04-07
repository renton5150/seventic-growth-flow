
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
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("checking");
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { login } = useAuth();

  // Define the checkServerConnection function first before using it
  const checkServerConnection = async () => {
    try {
      setNetworkStatus("checking");
      const startTime = Date.now();
      // Ajouter un timeout pour éviter que cela ne bloque trop longtemps
      const { error } = await Promise.race([
        supabase.from("profiles").select("count").limit(1),
        new Promise<{error: Error}>((_, reject) => 
          setTimeout(() => reject(new Error("Délai d'attente dépassé")), 5000)
        )
      ]) as any;
      
      const endTime = Date.now();
      
      console.log(`Temps de réponse du serveur: ${endTime - startTime}ms`);
      
      if (error) {
        console.error("Erreur de connexion:", error);
        setNetworkStatus("offline");
        setError(`Erreur de connexion au serveur: ${error.message}`);
        return false;
      }
      
      setNetworkStatus("online");
      setError(null);
      return true;
    } catch (err) {
      console.error("Exception lors de la vérification de la connexion:", err);
      setNetworkStatus("offline");
      setError("Impossible de se connecter au serveur Supabase");
      return false;
    }
  };

  // Now use checkServerConnection after it's been defined
  useState(() => {
    checkServerConnection();
  });

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    
    // Vérifier d'abord la connexion au serveur
    const serverAvailable = await checkServerConnection();
    if (!serverAvailable) {
      return false;
    }
    
    try {
      console.log("Lancement de la connexion pour:", email);
      
      // Appliquer un timeout à la connexion pour éviter les attentes infinies
      const loginPromise = login(email, password);
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error("La connexion prend trop de temps, veuillez réessayer.")), 15000)
      );
      
      const success = await Promise.race([loginPromise, timeoutPromise]);
      
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
          setError("Domaine email non autorisé - utilisez une adresse email valide");
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
