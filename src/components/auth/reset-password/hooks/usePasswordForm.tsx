
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Schéma de validation pour le formulaire
export const passwordSchema = z.object({
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .refine(val => /[A-Z]/.test(val), "Le mot de passe doit contenir au moins une majuscule")
    .refine(val => /[0-9]/.test(val), "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export interface UsePasswordFormProps {
  mode: "reset" | "setup";
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const usePasswordForm = ({ mode, onSuccess, onError }: UsePasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [email, setEmail] = useState("");
  const [isRequestingNewLink, setIsRequestingNewLink] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Vérifier la session au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const hasSession = !!sessionData.session;
        
        console.log("Vérification de session pour le formulaire de mot de passe:", hasSession ? "Session valide" : "Pas de session");
        setHasValidSession(hasSession);
        
        if (hasSession && sessionData.session?.user?.email) {
          setEmail(sessionData.session.user.email);
        }
        
        if (!hasSession) {
          onError("Aucune session active trouvée. Veuillez utiliser un lien valide ou demander un nouveau lien.");
          toast.error("Session invalide", {
            description: "Veuillez utiliser un lien valide ou demander un nouveau lien"
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        onError("Erreur lors de la vérification de la session. Veuillez réessayer.");
      } finally {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [onError]);

  const handleSubmit = async (values: PasswordFormValues) => {
    if (!hasValidSession) {
      onError("Aucune session active trouvée. Veuillez utiliser un lien valide ou demander un nouveau lien.");
      toast.error("Session invalide", {
        description: "Impossible de mettre à jour le mot de passe sans session valide"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log(`Tentative de ${mode === 'setup' ? 'configuration' : 'réinitialisation'} du mot de passe`);
      
      // Vérifier si nous avons une session active
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("État de la session avant mise à jour:", sessionData.session ? "Active" : "Inactive");
      
      if (!sessionData.session) {
        console.error("Pas de session active pour mettre à jour le mot de passe");
        onError("Aucune session active trouvée. Veuillez réessayer avec un lien valide.");
        toast.error("Session expirée", {
          description: "Veuillez demander un nouveau lien d'invitation ou de réinitialisation"
        });
        return;
      }
      
      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        onError(error.message);
        toast.error("Erreur de mise à jour", {
          description: error.message
        });
        return;
      }

      // Succès
      console.log("Mot de passe mis à jour avec succès");
      toast.success(mode === "setup" ? 
        "Mot de passe défini avec succès" : 
        "Mot de passe réinitialisé avec succès");
      
      onSuccess();
      
      // Rediriger vers la page de connexion après quelques secondes
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error) {
      console.error("Erreur inattendue:", error);
      onError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors de la mise à jour du mot de passe"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestNewLink = async () => {
    if (isRequestingNewLink) return;
    
    // Si nous n'avons pas d'email à utiliser
    if (!email) {
      toast.error("Impossible de demander un nouveau lien", {
        description: "Aucune adresse email connue. Veuillez utiliser la page de réinitialisation de mot de passe."
      });
      window.location.href = "/forgot-password";
      return;
    }
    
    setIsRequestingNewLink(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=${mode === "setup" ? "invite" : "recovery"}`,
      });
      
      if (error) {
        toast.error("Erreur", {
          description: `Impossible d'envoyer un nouveau lien: ${error.message}`
        });
      } else {
        toast.success("Email envoyé", {
          description: "Un nouveau lien a été envoyé à votre adresse email"
        });
      }
    } catch (error) {
      console.error("Erreur lors de la demande d'un nouveau lien:", error);
      toast.error("Erreur", {
        description: "Une erreur inattendue s'est produite"
      });
    } finally {
      setIsRequestingNewLink(false);
    }
  };

  return {
    form,
    isSubmitting,
    sessionChecked,
    hasValidSession,
    isRequestingNewLink,
    email,
    handleSubmit,
    handleRequestNewLink
  };
};
