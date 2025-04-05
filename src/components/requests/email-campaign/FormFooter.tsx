
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface FormFooterProps {
  submitting: boolean;
}

export const FormFooter = ({ submitting }: FormFooterProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-end space-x-4">
      <Button variant="outline" type="button" onClick={() => navigate(-1)}>
        Annuler
      </Button>
      <Button 
        type="submit" 
        className="bg-seventic-500 hover:bg-seventic-600"
        disabled={submitting}
      >
        {submitting ? "Création en cours..." : "Créer la demande"}
      </Button>
    </div>
  );
};
