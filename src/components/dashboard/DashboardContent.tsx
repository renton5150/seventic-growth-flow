
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { Request } from "@/types/types";
import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { FileText, Clock, Activity, AlertCircle, CheckCircle } from "lucide-react";

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
  
  // Calculate stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(req => req.workflow_status === 'pending_assignment').length || 0,
    inProgress: requests?.filter(req => req.workflow_status === 'in_progress').length || 0,
    late: requests?.filter(req => req.isLate).length || 0,
    completed: requests?.filter(req => req.workflow_status === 'completed').length || 0
  };

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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total des demandes"
          value={stats.total}
          icon={<FileText className="h-4 w-4" />}
          onClick={() => handleLocalFilterChange('all')}
          isActive={filterType === 'all'}
        />
        <StatCard
          title="En attente"
          value={stats.pending}
          icon={<Clock className="h-4 w-4" />}
          onClick={() => handleLocalFilterChange('pending')}
          isActive={filterType === 'pending'}
        />
        <StatCard
          title="En cours"
          value={stats.inProgress}
          icon={<Activity className="h-4 w-4" />}
          onClick={() => handleLocalFilterChange('inprogress')}
          isActive={filterType === 'inprogress'}
        />
        <StatCard
          title="En retard"
          value={stats.late}
          icon={<AlertCircle className="h-4 w-4" />}
          onClick={() => handleLocalFilterChange('late')}
          isActive={filterType === 'late'}
          className="bg-red-50"
        />
        <StatCard
          title="Terminées"
          value={stats.completed}
          icon={<CheckCircle className="h-4 w-4" />}
          onClick={() => handleLocalFilterChange('completed')}
          isActive={filterType === 'completed'}
          className="bg-green-50"
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

