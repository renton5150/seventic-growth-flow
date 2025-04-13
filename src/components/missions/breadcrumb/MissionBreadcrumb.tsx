
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Mission } from "@/types/types";
import { useAuth } from "@/contexts/auth";

interface MissionBreadcrumbProps {
  mission?: Mission | null;
  isLoading?: boolean;
}

export const MissionBreadcrumb = ({ mission, isLoading }: MissionBreadcrumbProps) => {
  const { isAdmin } = useAuth();
  
  // Determine la route parent selon le rôle de l'utilisateur
  const parentRoute = isAdmin ? "/admin/missions" : "/missions";
  
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">Tableau de bord</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={parentRoute}>Missions</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          {isLoading ? (
            <BreadcrumbPage className="animate-pulse bg-muted rounded w-24 h-4" />
          ) : mission ? (
            <BreadcrumbPage>{mission.name}</BreadcrumbPage>
          ) : (
            <BreadcrumbPage>Détail de la mission</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
