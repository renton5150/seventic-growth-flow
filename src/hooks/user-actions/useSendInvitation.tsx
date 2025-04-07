
import { useState } from "react";
import { resendInvitation } from "@/services/user";
import { toast } from "sonner";
import { User } from "@/types/types";

export const useSendInvitation = (user: User, onActionComplete: () => void) => {
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleResendInvite = async () => {
    if (isSendingInvite) return;
    
    try {
      setIsSendingInvite(true);
      
      // Afficher un toast de chargement persistant
      const toastId = toast.loading(`Envoi de l'invitation à ${user.email}...`, {
        description: "Cela peut prendre jusqu'à 30 secondes, veuillez patienter."
      });
      
      const { success, error, warning, details } = await resendInvitation(user.email);
      
      // Fermer le toast de chargement
      toast.dismiss(toastId);
      
      if (success) {
        toast.success(`Email envoyé à ${user.email}`, {
          description: "Un email avec un lien d'invitation ou de réinitialisation a été envoyé. Vérifiez également dans les spams/indésirables.",
          duration: 8000,
          action: {
            label: "Logs",
            onClick: () => {
              window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank");
            },
          },
        });
        onActionComplete();
      } else if (warning) {
        // Afficher un toast d'avertissement si l'opération a pris du temps mais peut avoir réussi
        toast.warning(warning, {
          description: "Vérifiez votre boîte de réception et vos spams, l'email a peut-être bien été envoyé.",
          duration: 8000,
          action: {
            label: "Logs",
            onClick: () => {
              window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank");
            },
          },
        });
      } else {
        // Afficher des informations de débogage dans la console
        console.error("Erreur détaillée du renvoi d'invitation:", details || error);
        
        // Message pour cas spécifique d'utilisateur déjà enregistré
        if (error?.includes("déjà enregistré") || error?.includes("already been registered")) {
          toast.info(`${user.name} a déjà un compte`, {
            description: "Un email de réinitialisation de mot de passe a été envoyé à la place d'une invitation.",
            duration: 8000,
            action: {
              label: "Logs",
              onClick: () => {
                window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank");
              },
            },
          });
          onActionComplete();
          return;
        }
        
        // Message générique complet avec plus de détails
        toast.error(`Erreur d'envoi`, {
          description: `${error || "Une erreur est survenue lors de l'envoi de l'email."}`,
          duration: 8000,
          action: {
            label: "Logs",
            onClick: () => {
              window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank");
            },
          },
        });
        
        // Toast d'aide supplémentaire avec lien vers la config SMTP
        setTimeout(() => {
          toast.info("Vérifiez la configuration SMTP", {
            description: "Assurez-vous que vos paramètres SMTP sont corrects et que votre serveur d'email fonctionne.",
            duration: 10000,
            action: {
              label: "Config SMTP",
              onClick: () => {
                window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/auth/smtp", "_blank");
              },
            },
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Exception lors du renvoi de l'invitation:", error);
      toast.error("Erreur de communication", {
        description: "Impossible de contacter la fonction Edge. Vérifiez votre connexion internet ou les logs pour plus de détails."
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  return {
    isSendingInvite,
    handleResendInvite
  };
};
