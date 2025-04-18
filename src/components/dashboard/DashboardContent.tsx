
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Request } from "@/types/types";
import { GrowthStatsCards } from "@/components/growth/GrowthStatsCards";
import { useState } from "react";

interface DashboardContentProps {
  requests: Request[];
  isAdmin: boolean;
  onRequestDeleted: () => void;
}

export const DashboardContent = ({ requests, isAdmin, onRequestDeleted }: DashboardContentProps) => {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  console.log('DashboardContent rendering with requests:', requests);

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

  return (
    <div className="space-y-6">
      <DashboardHeader isSDR={!isAdmin} />
      
      {/* Explicit stats cards inclusion */}
      <GrowthStatsCards 
        data={requests}
        onFilterChange={setFilterType}
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
