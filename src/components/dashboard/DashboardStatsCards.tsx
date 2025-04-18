
import { Card } from "@/components/ui/card";
import { FileText, Clock, Activity, AlertCircle, CheckCircle } from "lucide-react";
import { Request } from "@/types/types";

interface DashboardStatsCardsProps {
  requests: Request[];
  onFilterChange: (filter: string | null) => void;
  activeFilter: string | null;
}

export function DashboardStatsCards({ requests, onFilterChange, activeFilter }: DashboardStatsCardsProps) {
  // Calculate stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(req => req.workflow_status === 'pending_assignment').length || 0,
    inProgress: requests?.filter(req => req.workflow_status === 'in_progress').length || 0,
    late: requests?.filter(req => req.isLate).length || 0,
    completed: requests?.filter(req => req.workflow_status === 'completed').length || 0
  };

  const StatCard = ({ title, value, icon, filter, bgColor = "" }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${activeFilter === filter ? 'ring-2 ring-primary' : ''} ${bgColor}`}
      onClick={() => onFilterChange(filter)}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6" data-testid="dashboard-stats">
      <StatCard
        title="Total des demandes"
        value={stats.total}
        icon={<FileText className="h-4 w-4" />}
        filter="all"
      />
      <StatCard
        title="En attente"
        value={stats.pending}
        icon={<Clock className="h-4 w-4" />}
        filter="pending"
      />
      <StatCard
        title="En cours"
        value={stats.inProgress}
        icon={<Activity className="h-4 w-4" />}
        filter="inprogress"
      />
      <StatCard
        title="En retard"
        value={stats.late}
        icon={<AlertCircle className="h-4 w-4" />}
        filter="late"
        bgColor="bg-red-50"
      />
      <StatCard
        title="Terminées"
        value={stats.completed}
        icon={<CheckCircle className="h-4 w-4" />}
        filter="completed"
        bgColor="bg-green-50"
      />
    </div>
  );
}
