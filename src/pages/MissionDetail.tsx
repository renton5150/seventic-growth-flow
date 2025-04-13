
import { useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMission } from "@/hooks/useMission";
import { useAuth } from "@/contexts/auth";
import { MissionCard } from "@/components/missions/details/MissionCard";
import { MissionBreadcrumb } from "@/components/missions/breadcrumb/MissionBreadcrumb";
import { MissionDetailsContent } from "@/components/missions/details";
import { Button } from "@/components/ui/button";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";
import { DeleteMissionDialog } from "@/components/missions/DeleteMissionDialog";
import { ArrowLeft, Loader2, AlertCircle, Edit, Trash2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const MissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  
  const { 
    mission, 
    isLoading, 
    isError, 
    error, 
    refreshMission 
  } = useMission(id);

  const isSdr = user?.role === "sdr";
  const canEdit = isAdmin || (isSdr && mission?.sdrId === user?.id);
  const canDelete = isAdmin;
  
  // Redirection si l'utilisateur n'a pas les permissions nécessaires
  if (!isLoading && !isError && mission && !isAdmin && isSdr && mission.sdrId !== user?.id) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  const handleEditSuccess = () => {
    refreshMission();
    setIsEditModalOpen(false);
  };
  
  const handleDeleteSuccess = () => {
    // Rediriger vers la liste des missions après suppression
    const redirectPath = isAdmin ? "/admin/missions" : "/missions";
    navigate(redirectPath, { replace: true });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <MissionBreadcrumb mission={mission} isLoading={isLoading} />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="animate-fade-in"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            
            <h1 className="text-2xl font-bold animate-fade-in truncate">
              {isLoading ? (
                <span className="animate-pulse bg-muted rounded w-48 h-8 block" />
              ) : mission?.name || "Détails de la mission"}
            </h1>
          </div>
          
          <div className="flex gap-2 animate-fade-in">
            {canEdit && !isLoading && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </Button>
            )}
            
            {canDelete && !isLoading && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </Button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64 animate-fade-in">
            <Loader2 size={40} className="animate-spin text-primary" />
            <span className="ml-2">Chargement des détails de la mission...</span>
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="mb-4 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>Une erreur est survenue lors du chargement de la mission.</p>
              <p className="text-sm opacity-80">
                {error instanceof Error ? error.message : "Veuillez réessayer ultérieurement."}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMission}
                className="w-fit mt-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        ) : mission ? (
          <div className="grid grid-cols-1 gap-6 animate-fade-in">
            <MissionCard mission={mission} />
            
            <Button 
              variant="outline" 
              className="mx-auto"
              onClick={() => setIsFullViewOpen(true)}
            >
              Voir tous les détails
            </Button>
            
            {/* Dialog pour vue détaillée */}
            <Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
              <DialogContent className="max-w-4xl">
                <MissionDetailsContent mission={mission} isSdr={isSdr} />
              </DialogContent>
            </Dialog>
            
            {/* Dialogs pour édition et suppression */}
            {mission && (
              <>
                <EditMissionDialog
                  mission={mission}
                  open={isEditModalOpen}
                  onOpenChange={setIsEditModalOpen}
                  onMissionUpdated={handleEditSuccess}
                />
                
                <DeleteMissionDialog
                  missionId={mission.id}
                  missionName={mission.name}
                  isOpen={isDeleteModalOpen}
                  onOpenChange={setIsDeleteModalOpen}
                  onDeleted={handleDeleteSuccess}
                />
              </>
            )}
          </div>
        ) : (
          <Alert className="mb-4 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Mission introuvable</AlertTitle>
            <AlertDescription>
              Cette mission n'existe pas ou a été supprimée.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
};

export default MissionDetail;
