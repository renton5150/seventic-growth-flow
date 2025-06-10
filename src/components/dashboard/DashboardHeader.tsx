
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ArrowLeft } from "lucide-react";
import { CreateRequestMenu } from "./CreateRequestMenu";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  isSDR?: boolean;
  isGrowth?: boolean;
  isAdmin?: boolean;
  filterParams?: {
    createdBy?: string;
    assignedTo?: string;
    showUnassigned?: boolean;
    filterType?: string;
    userName?: string;
  };
}

export const DashboardHeader = ({ 
  isSDR = false, 
  isGrowth = false, 
  isAdmin = false,
  filterParams 
}: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const getTitle = () => {
    if (filterParams?.showUnassigned) {
      return "Demandes non assignées";
    }
    if (filterParams?.userName) {
      return `Demandes de ${filterParams.userName}`;
    }
    if (isSDR) return "Mes demandes";
    if (isGrowth) return "Demandes Growth";
    if (isAdmin) return "Toutes les demandes";
    return "Tableau de bord";
  };

  const getSubtitle = () => {
    if (filterParams?.showUnassigned) {
      return "Toutes les demandes en attente d'assignation";
    }
    if (filterParams?.filterType === 'sdr') {
      return `Demandes créées par ${filterParams.userName}`;
    }
    if (filterParams?.filterType === 'growth') {
      return `Demandes assignées à ${filterParams.userName}`;
    }
    if (isSDR) return "Suivi de vos demandes en cours";
    if (isGrowth) return "Gérer les demandes assignées";
    if (isAdmin) return "Vue d'ensemble administrative";
    return "Gestion des demandes";
  };

  const showBackButton = filterParams?.createdBy || filterParams?.assignedTo || filterParams?.showUnassigned;

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour Admin
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <p className="text-muted-foreground">{getSubtitle()}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </Button>
        )}
        
        {(isSDR || isAdmin) && !filterParams?.showUnassigned && (
          <CreateRequestMenu>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle demande
            </Button>
          </CreateRequestMenu>
        )}
      </div>
    </div>
  );
};
