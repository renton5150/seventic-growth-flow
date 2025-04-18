
import { useLocation } from "react-router-dom";

interface GrowthDashboardHeaderProps {
  totalRequests: number;
}

export const GrowthDashboardHeader = ({ totalRequests }: GrowthDashboardHeaderProps) => {
  const location = useLocation();
  
  const pageTitle = location.pathname.includes("/my-requests") 
    ? "Mes opérations à traiter" 
    : "Tableau de bord";

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">{pageTitle}</h1>
    </div>
  );
};
