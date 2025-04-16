
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormFooterProps {
  submitting: boolean;
  editMode?: boolean;
}

export const FormFooter = ({ submitting, editMode = false }: FormFooterProps) => {
  return (
    <div className="flex justify-end">
      <Button
        type="submit"
        className="bg-seventic-500 hover:bg-seventic-600"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours...
          </>
        ) : (
          editMode ? "Mettre à jour la demande" : "Soumettre la demande"
        )}
      </Button>
    </div>
  );
};
