
import { CreateRequestMenu } from "./CreateRequestMenu";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardHeaderProps {
  isSDR: boolean;
  isGrowth: boolean;
  isAdmin: boolean;
  filterParams?: {
    createdBy?: string;
    assignedTo?: string;
    showUnassigned?: boolean;
    filterType?: string;
    userName?: string;
  };
}

export const DashboardHeader = ({ isSDR, isGrowth, isAdmin, filterParams }: DashboardHeaderProps) => {
  const { user } = useAuth();
  
  // Tous les rôles peuvent créer des demandes
  const canCreateRequests = ['sdr', 'growth', 'admin'].includes(user?.role || '');

  const getHeaderTitle = () => {
    if (filterParams?.userName) {
      return `Dashboard - ${filterParams.userName}`;
    }
    
    if (isAdmin && !filterParams?.createdBy && !filterParams?.assignedTo) {
      return "Dashboard Administrateur";
    }
    
    if (isGrowth) {
      return "Dashboard Growth";
    }
    
    if (isSDR) {
      return "Mes demandes";
    }
    
    return "Dashboard";
  };

  const getHeaderDescription = () => {
    if (filterParams?.userName) {
      return `Vue des demandes pour ${filterParams.userName}`;
    }
    
    if (isAdmin && !filterParams?.createdBy && !filterParams?.assignedTo) {
      return "Vue d'ensemble de toutes les demandes";
    }
    
    if (isGrowth) {
      return "Gérez et assignez les demandes de l'équipe";
    }
    
    if (isSDR) {
      return "Suivez l'état de vos demandes";
    }
    
    return "Vue d'ensemble de vos demandes";
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">{getHeaderTitle()}</h1>
        <p className="mt-2 text-gray-500">
          {getHeaderDescription()}
        </p>
      </div>
      
      {canCreateRequests && <CreateRequestMenu />}
    </div>
  );
};
