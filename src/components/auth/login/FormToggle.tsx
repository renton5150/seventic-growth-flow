
import { type AuthFormMode } from "./LoginForm";

interface FormToggleProps {
  formMode: AuthFormMode;
  onToggle: () => void;
}

export const FormToggle = ({ formMode, onToggle }: FormToggleProps) => {
  return (
    <div className="w-full text-sm text-center text-muted-foreground">
      {formMode === "login" ? (
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
