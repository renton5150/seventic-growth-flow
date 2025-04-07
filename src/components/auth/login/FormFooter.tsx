
import { useState } from "react";

interface FormFooterProps {
  isLogin: boolean;
  onToggle: () => void;
}

export const FormFooter = ({ isLogin, onToggle }: FormFooterProps) => {
  return (
    <div className="text-sm text-center text-muted-foreground">
      {isLogin ? (
        <p>
          Vous n'avez pas de compte?{" "}
          <button 
            type="button"
            onClick={onToggle}
            className="text-seventic-500 hover:text-seventic-600 font-medium"
          >
            Inscrivez-vous
          </button>
        </p>
      ) : (
        <p>
          Vous avez déjà un compte?{" "}
          <button 
            type="button"
            onClick={onToggle}
            className="text-seventic-500 hover:text-seventic-600 font-medium"
          >
            Connectez-vous
          </button>
        </p>
      )}
    </div>
  );
};
