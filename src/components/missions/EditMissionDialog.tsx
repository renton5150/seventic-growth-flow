
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mission } from "@/types/types";
import { updateMission } from "@/services/missions-service"; 
import { MissionForm } from "./form/MissionForm";
import { MissionFormValues } from "./schemas/missionFormSchema";
import { ErrorBoundary } from "react-error-boundary";

interface EditMissionDialogProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMissionUpdated?: () => void;
}

// Simple fallback component for error handling
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded text-center">
      <h3 className="text-lg font-semibold text-red-700 mb-2">Une erreur est survenue</h3>
      <p className="text-sm text-red-600 mb-4">{error.message || "Erreur lors du chargement du formulaire d'édition"}</p>
      <div className="flex justify-center">
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

export function EditMissionDialog({
  mission,
  open,
  onOpenChange,
  onMissionUpdated,
}: EditMissionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Function to close the dialog and reset state
  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };
  
  // Fonction de soumission du formulaire avec gestion d'erreurs améliorée
  const onSubmit = async (values: MissionFormValues) => {
    if (!mission) return;
    
    try {
      console.log("Formulaire de mise à jour soumis avec les valeurs:", values);
      console.log("SDR ID sélectionné pour mise à jour:", values.sdrId);
      console.log("Status sélectionné pour mise à jour:", values.status);
      
      setIsSubmitting(true);
      
      const updatedMissionData = {
        id: mission.id,
        name: values.name,
        sdrId: values.sdrId,
        description: values.description || "",
        startDate: values.startDate,
        endDate: values.endDate,
        type: values.type,
        status: values.status
      };
      
      console.log("Données préparées pour la mise à jour:", updatedMissionData);
      
      // Appel API pour mettre à jour avec timeout de sécurité
      const result = await updateMission(updatedMissionData);
      
      console.log("Résultat de la mise à jour:", result);
      
      // Fermer le dialogue AVANT de déclencher la mise à jour
      setIsSubmitting(false);
      handleClose();
      
      // Délai court pour s'assurer que le dialogue est fermé
      setTimeout(() => {
        // Afficher le toast de succès
        toast.success("Mission mise à jour", {
          description: `La mission "${values.name}" a été mise à jour avec succès.`
        });
        
        // Appeler la fonction de rappel pour mettre à jour la liste
        if (onMissionUpdated) {
          onMissionUpdated();
        }
      }, 100);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setIsSubmitting(false);
      toast.error("Erreur lors de la mise à jour", {
        description: "Une erreur est survenue lors de la mise à jour de la mission"
      });
    }
  };
  
  const handleCancel = () => {
    handleClose();
  };
  
  // Vérifier si on a bien les données requises avant de montrer le formulaire
  const isMissionDataValid = mission && mission.id && mission.name;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="mission-edit-description">
        <DialogHeader>
          <DialogTitle>Modifier la mission</DialogTitle>
          <p id="mission-edit-description" className="sr-only">Formulaire de modification d'une mission</p>
        </DialogHeader>
        
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => handleClose()}>
          {isMissionDataValid ? (
            <MissionForm
              mission={mission}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              onCancel={handleCancel}
            />
          ) : (
            <div className="p-4 text-center text-amber-600 bg-amber-50 rounded">
              Impossible de charger les données de la mission. Veuillez réessayer.
            </div>
          )}
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
