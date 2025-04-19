
import { useState } from "react";
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
  
  // Fonction simplifiée de fermeture de la boite de dialogue
  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };
  
  const onSubmit = async (values: MissionFormValues) => {
    if (!mission) return;
    
    setIsSubmitting(true);
    
    try {
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
      
      // Étape 1: Fermer la boîte de dialogue immédiatement pour éviter les problèmes de rendu
      handleClose();
      
      // Étape 2: Appel API pour mettre à jour - après la fermeture pour éviter les conflits d'état
      await updateMission(updatedMissionData);
      
      // Étape 3: Notification et rafraichissement des données
      setTimeout(() => {
        toast.success("Mission mise à jour", {
          description: `La mission "${values.name}" a été mise à jour avec succès.`
        });
        
        if (onMissionUpdated) {
          onMissionUpdated();
        }
      }, 100);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour", {
        description: "Une erreur est survenue lors de la mise à jour de la mission"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    handleClose();
  };
  
  // Vérifier si on a bien les données requises avant de montrer le formulaire
  const isMissionDataValid = mission && mission.id && mission.name;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        aria-describedby="mission-edit-description"
      >
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
