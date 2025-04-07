
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
      
      // Use Promise.race for timeout handling instead of AbortController
      const loginPromise = login(email, password);
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          toast.error("La connexion prend trop de temps", {
            description: "Veuillez réessayer plus tard."
          });
          resolve(false);
        }, 8000);
      });
      
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
      
      // Use Promise.race for timeout handling
      const signupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "sdr"  // Default role
          }
        }
      });
      
      const timeoutPromise = new Promise<{data: null, error: Error}>((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error("L'inscription prend trop de temps, veuillez réessayer."));
        }, 8000);
      });
      
      const { data, error: signUpError } = await Promise.race([signupPromise, timeoutPromise]) as any;
      
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
      
      if (data?.user) {
        toast.success("Inscription réussie", {
          description: "Votre compte a été créé. Vous pouvez maintenant vous connecter."
        });
        setIsSigningUp(false);
        return true;
      } else if (data?.session) {
        toast.success("Inscription et connexion réussies");
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

  return {
    isSigningUp,
    handleLogin,
    handleSignup
  };
};
