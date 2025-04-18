
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Request } from "@/types/types";
import { GrowthStatsCards } from "@/components/growth/GrowthStatsCards";
import { useState, useEffect } from "react";

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
  
  console.log('DashboardContent rendering with requests:', requests);

  useEffect(() => {
    console.log("DashboardContent mounted");
    
    // Inspecter le DOM
    const statsCards = document.querySelector('[data-testid="stats-cards"]');
    console.log("Stats cards element found:", !!statsCards);
  }, []);

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
      
      {/* Explicit stats cards inclusion with forced visibility */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        <GrowthStatsCards 
          data={requests}
          onFilterChange={handleLocalFilterChange}
        />
      </div>
      
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
