
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormFooterProps {
  submitting: boolean;
  editMode?: boolean;
}

export const FormFooter = ({ submitting, editMode = false }: FormFooterProps) => {
  return (
    <div className="flex justify-end gap-2 pt-4 pb-8">
      <Button 
        type="submit" 
        disabled={submitting}
        className="min-w-[120px]"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {editMode ? "Mise à jour..." : "Création..."}
          </>
        ) : (
          editMode ? "Mettre à jour" : "Créer la demande"
        )}
      </Button>
    </div>
  );
};
