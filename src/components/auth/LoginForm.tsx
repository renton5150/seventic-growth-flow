import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FormHeader } from "./login/FormHeader";
import { FormFooter } from "./login/FormFooter";
import { ConnectionStatus } from "./login/ConnectionStatus";
import { ErrorMessage } from "./login/ErrorMessage";
import { LoginFields } from "./login/LoginFields";
import { SignupFields } from "./login/SignupFields";

export const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("online"); // Définir comme "online" par défaut
  const { login } = useAuth();
  const navigate = useNavigate();

  // Ne vérifie que le statut de connexion du navigateur
  useEffect(() => {
    // Uniquement mettre à jour le statut de connexion en fonction du navigateur
    const handleOnline = () => {
      console.log("Network connection restored");
      setNetworkStatus("online");
      setError(null);
    };
    
    const handleOffline = () => {
      console.log("Network connection lost");
      setNetworkStatus("offline");
      setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
    };
    
    // Définir le statut initial
    setNetworkStatus(navigator.onLine ? "online" : "offline");
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (networkStatus === "offline") {
        setError("Impossible de se connecter: vous êtes hors ligne");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Attempting login with:", email);
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("Échec de la connexion. Vérifiez vos identifiants.");
      }
    } catch (error) {
      console.error("Error during login attempt:", error);
      setError("Une erreur est survenue lors de la connexion. Veuillez réessayer.");
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la connexion",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (networkStatus === "offline") {
        setError("Impossible de créer un compte: vous êtes hors ligne");
        setIsSubmitting(false);
        return;
      }
      
      if (!email || !password) {
        setError("Veuillez remplir tous les champs obligatoires.");
        setIsSubmitting(false);
        return;
      }
      
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        setIsSubmitting(false);
        return;
      }

      console.log("Attempting signup with:", email);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            role: "sdr"  // Default role for new users
          }
        }
      });

      if (signUpError) {
        console.error("Error during signup:", signUpError);
        
        if (signUpError.message.includes("already registered")) {
          setError("Cette adresse email est déjà utilisée. Veuillez vous connecter.");
        } else {
          setError(signUpError.message);
        }
        
        toast.error("Erreur d'inscription", {
          description: signUpError.message
        });
        return;
      }

      if (data.user) {
        toast.success("Inscription réussie", {
          description: "Votre compte a été créé. Vous pouvez maintenant vous connecter."
        });
        setIsLogin(true);
        setPassword("");
      } else {
        toast.info("Vérification requise", {
          description: "Veuillez vérifier votre email pour confirmer votre compte."
        });
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setError("Une erreur est survenue lors de l'inscription");
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de l'inscription"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
  };

  const retryConnection = () => {
    // Simple vérification basée sur le statut de connexion du navigateur
    setNetworkStatus(navigator.onLine ? "online" : "offline");
    setError(navigator.onLine ? null : "Vous êtes hors ligne. Vérifiez votre connexion internet.");
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {isLogin ? "Connexion" : "Inscription"}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin 
            ? "Entrez vos identifiants pour accéder à votre compte" 
            : "Créez un compte pour commencer à utiliser l'application"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormHeader />
        
        <ConnectionStatus 
          status={networkStatus} 
          onRetry={retryConnection}
          error={error}
          retryCount={0}
        />
        
        <ErrorMessage error={error} />
        
        {isLogin ? (
          <LoginFields
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            toggleShowPassword={toggleShowPassword}
            isSubmitting={isSubmitting}
            isOffline={networkStatus === "offline"}
            onSubmit={handleLoginSubmit}
          />
        ) : (
          <SignupFields
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            name={name}
            setName={setName}
            showPassword={showPassword}
            toggleShowPassword={toggleShowPassword}
            isSubmitting={isSubmitting}
            isOffline={networkStatus === "offline"}
            onSubmit={handleSignupSubmit}
          />
        )}
      </CardContent>
      <CardFooter>
        <FormFooter isLogin={isLogin} onToggle={toggleForm} />
      </CardFooter>
    </Card>
  );
};
