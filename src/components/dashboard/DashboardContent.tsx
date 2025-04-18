
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Request } from "@/types/types";
import { useState } from "react";
import { DashboardStatsCards } from "./DashboardStatsCards";

interface DashboardContentProps {
  requests: Request[];
  isAdmin: boolean;
  onRequestDeleted: () => void;
  onFilterChange?: (filter: string | null) => void;
}

export const DashboardContent = ({ 
  requests, 
  isAdmin, 
  onRequestDeleted,
  onFilterChange
}: DashboardContentProps) => {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Filter requests based on type
  const getFilteredRequests = () => {
    if (!requests || !filterType) return requests;
    
    switch (filterType) {
      case 'all': 
        return requests;
      case 'pending': 
        return requests.filter(r => ['pending', 'in_progress'].includes(r.workflow_status || ''));
      case 'completed': 
        return requests.filter(r => r.workflow_status === 'completed');
      case 'overdue': 
        return requests.filter(r => r.isLate);
      default: 
        return requests;
    }
  };

  const handleLocalFilterChange = (newFilter: string | null) => {
    console.log("Filter changed in DashboardContent to:", newFilter);
    setFilterType(newFilter);
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader isSDR={!isAdmin} />
      
      <DashboardStatsCards
        requests={requests}
        onFilterChange={handleLocalFilterChange}
        activeFilter={filterType}
      />
      
      <DashboardTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filteredRequests={getFilteredRequests()}
        isAdmin={isAdmin}
        onRequestDeleted={onRequestDeleted}
      />
    </div>
  );
};
