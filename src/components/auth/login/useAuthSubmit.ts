
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAuthSubmit = (
  checkServerConnection: () => Promise<boolean>,
  setError: (error: string | null) => void
) => {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { login } = useAuth();

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

  return {
    isSigningUp,
    handleLogin,
    handleSignup
  };
};
