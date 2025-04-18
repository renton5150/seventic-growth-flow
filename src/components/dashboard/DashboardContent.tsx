
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Request } from "@/types/types";
import { DashboardStatsCards } from "@/components/growth/stats/DashboardStatsCards";
import { DashboardFilters } from "./DashboardFilters";
import { useState } from "react";

interface DashboardContentProps {
  requests: Request[];
  isAdmin: boolean;
  onRequestDeleted: () => void;
}

export const DashboardContent = ({ requests, isAdmin, onRequestDeleted }: DashboardContentProps) => {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  return (
    <div className="space-y-6">
      <DashboardHeader isSDR={!isAdmin} />
      <DashboardStatsCards 
        requestsData={requests}
        onFilterChange={setFilterType}
      />
      <DashboardFilters 
        allRequests={requests} 
        setFilterType={setFilterType} 
      />
      <DashboardTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filteredRequests={requests}
        isAdmin={isAdmin}
        onRequestDeleted={onRequestDeleted}
      />
    </div>
  );
};
