
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { NetworkStatus } from "./NetworkStatus";
import { LoginFormContent } from "./LoginFormContent";
import { SignupFormContent } from "./SignupFormContent";
import { FormToggle } from "./FormToggle";
import { DemoAlert } from "./DemoAlert";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type AuthFormMode = "login" | "signup";

interface LoginFormProps {
  showDemoMode?: boolean;
}

export const LoginForm = ({ showDemoMode = false }: LoginFormProps) => {
  const [formMode, setFormMode] = useState<AuthFormMode>("login");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("checking");
  const [error, setError] = useState<string | null>(null);
  const [isAdminSignup, setIsAdminSignup] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Vérifier la connexion réseau et Supabase au chargement
  useEffect(() => {
    const checkConnection = async () => {
      setNetworkStatus("checking");
      
      // Vérifier la connexion internet
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        setError("Vous semblez être hors ligne. Vérifiez votre connexion internet.");
        return;
      }
      
      // Vérifier la connexion à Supabase
      try {
        const start = Date.now();
        const { error } = await supabase.from("missions").select("id").limit(1);
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
    
    // Surveiller les changements de connectivité
    const handleOnline = () => {
      console.log("Connexion réseau rétablie");
      checkConnection();
    };
    
    const handleOffline = () => {
      console.log("Connexion réseau perdue");
      setNetworkStatus("offline");
      setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLoginSubmit = async (email: string, password: string) => {
    setError(null);

    try {
      if (networkStatus === "offline") {
        setError("Impossible de se connecter: vous êtes hors ligne");
        return false;
      }
      
      console.log("Tentative de connexion avec:", email);
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
        return true;
      } else {
        setError("Échec de la connexion. Vérifiez vos identifiants.");
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de la tentative de connexion:", error);
      setError("Une erreur est survenue lors de la connexion. Veuillez réessayer.");
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la connexion",
      });
      return false;
    }
  };

  const handleSignupSubmit = async (email: string, password: string, name: string) => {
    setError(null);

    try {
      if (networkStatus === "offline") {
        setError("Impossible de créer un compte: vous êtes hors ligne");
        return false;
      }
      
      if (!email || !password) {
        setError("Veuillez remplir tous les champs obligatoires.");
        return false;
      }
      
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        return false;
      }

      console.log("Tentative d'inscription avec:", email);
      
      // Utiliser le rôle admin si l'option est sélectionnée
      const userRole = isAdminSignup ? "admin" : "sdr";
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            role: userRole  // Utiliser le rôle défini
          }
        }
      });

      if (signUpError) {
        console.error("Erreur lors de l'inscription:", signUpError);
        
        if (signUpError.message.includes("already registered")) {
          setError("Cette adresse email est déjà utilisée. Veuillez vous connecter.");
        } else {
          setError(signUpError.message);
        }
        
        toast.error("Erreur d'inscription", {
          description: signUpError.message
        });
        return false;
      }

      if (data.user) {
        toast.success("Inscription réussie", {
          description: isAdminSignup 
            ? "Votre compte administrateur a été créé. Vous pouvez maintenant vous connecter."
            : "Votre compte a été créé. Vous pouvez maintenant vous connecter."
        });
        setFormMode("login");
        return true;
      } else {
        toast.info("Vérification requise", {
          description: "Veuillez vérifier votre email pour confirmer votre compte."
        });
        return true;
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      setError("Une erreur est survenue lors de l'inscription");
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de l'inscription"
      });
      return false;
    }
  };

  const toggleForm = () => {
    setFormMode(formMode === "login" ? "signup" : "login");
    setError(null);
    // Reset admin signup when toggling form
    setIsAdminSignup(false);
  };

  const toggleAdminSignup = () => {
    setIsAdminSignup(!isAdminSignup);
  };

  const retryConnection = () => {
    setNetworkStatus("checking");
    setError(null);
    
    // Déclencher une nouvelle vérification de connexion
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from("missions").select("id").limit(1);
        
        if (error) {
          console.error("Échec du test de connexion à Supabase:", error);
          setNetworkStatus("offline");
          setError(`Problème de connexion au serveur: ${error.message}`);
        } else {
          console.log("Connexion à Supabase OK");
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
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {formMode === "login" ? "Connexion" : "Inscription"}
        </CardTitle>
        <CardDescription className="text-center">
          {formMode === "login" 
            ? "Entrez vos identifiants pour accéder à votre compte" 
            : "Créez un compte pour commencer à utiliser l'application"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* N'afficher l'alerte que si showDemoMode est vrai */}
        <DemoAlert showDemoMode={showDemoMode} />
        
        <NetworkStatus 
          status={networkStatus} 
          error={error} 
          onRetry={retryConnection} 
        />
        
        {formMode === "login" ? (
          <LoginFormContent 
            onSubmit={handleLoginSubmit}
            isOffline={networkStatus === "offline" || networkStatus === "checking"}
          />
        ) : (
          <SignupFormContent
            onSubmit={handleSignupSubmit}
            isOffline={networkStatus === "offline" || networkStatus === "checking"}
            isAdminSignup={isAdminSignup}
            onToggleAdminSignup={toggleAdminSignup}
          />
        )}
      </CardContent>
      <CardFooter>
        <FormToggle formMode={formMode} onToggle={toggleForm} />
      </CardFooter>
    </Card>
  );
};
