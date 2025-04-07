
import { useState, useEffect } from "react";
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

  // Define the checkServerConnection function
  const checkServerConnection = async () => {
    try {
      setNetworkStatus("checking");
      const startTime = Date.now();
      // Add a timeout to avoid blocking too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const { error } = await supabase.from("profiles")
          .select("count")
          .limit(1)
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
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
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.error("Requête annulée par délai d'attente");
          setNetworkStatus("offline");
          setError("Le serveur met trop de temps à répondre");
        } else {
          console.error("Erreur lors de la requête:", err);
          setNetworkStatus("offline");
          setError("Erreur lors de la connexion au serveur");
        }
        return false;
      }
    } catch (err) {
      console.error("Exception lors de la vérification de la connexion:", err);
      setNetworkStatus("offline");
      setError("Impossible de se connecter au serveur Supabase");
      return false;
    }
  };

  // Use useEffect instead of useState for async operations
  useEffect(() => {
    console.log("Vérification de la connexion au serveur...");
    checkServerConnection();
    
    // Check connection again if the user comes back online
    const handleOnline = () => {
      console.log("Connexion internet rétablie, vérification du serveur...");
      checkServerConnection();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    
    // Check server connection first
    const serverAvailable = await checkServerConnection();
    if (!serverAvailable) {
      return false;
    }
    
    try {
      console.log("Lancement de la connexion pour:", email);
      
      // Apply a timeout to login to avoid infinite waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const success = await login(email, password);
        clearTimeout(timeoutId);
        
        if (success) {
          console.log("Connexion réussie");
          toast.success("Connexion réussie");
          return true;
        } else {
          setError("Échec de la connexion. Vérifiez vos identifiants.");
          return false;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setError("La connexion prend trop de temps, veuillez réessayer.");
        } else {
          const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
          setError(errorMessage);
          console.error("Erreur lors de la connexion:", errorMessage);
          toast.error("Erreur de connexion", {
            description: errorMessage
          });
        }
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
    
    // Check server connection first
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
      
      // Apply a timeout to signup to avoid infinite waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        // Create a new account with email/password
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: "sdr"  // Default role
            }
          }
        });
        
        clearTimeout(timeoutId);
        
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
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setError("L'inscription prend trop de temps, veuillez réessayer.");
        } else {
          const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
          setError(errorMessage);
          console.error("Erreur lors de l'inscription:", errorMessage);
          toast.error("Erreur d'inscription", {
            description: errorMessage
          });
        }
        setIsSigningUp(false);
        return false;
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
