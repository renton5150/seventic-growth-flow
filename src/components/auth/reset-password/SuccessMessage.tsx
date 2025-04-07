
import { ReactNode } from "react";

interface SuccessMessageProps {
  mode: "reset" | "setup";
}

export const SuccessMessage = ({ mode }: SuccessMessageProps) => {
  return (
    <div className="text-center py-4">
      <div className="mx-auto bg-green-100 text-green-800 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-1">
        {mode === "setup" ? "Compte configuré avec succès!" : "Mot de passe mis à jour!"}
      </h3>
      <p className="text-gray-600 mb-4">
        {mode === "setup" 
          ? "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." 
          : "Votre mot de passe a été réinitialisé avec succès."}
      </p>
      <p className="text-sm text-gray-500">
        Redirection vers la page de connexion...
      </p>
    </div>
  );
};
