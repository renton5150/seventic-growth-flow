
import { Clock, Database, Inbox, MailCheck } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Request } from "@/types/types";

interface DashboardStatsCardsProps {
  requestsData: Request[];
  onFilterChange: (filterType: string | null) => void;
}

export const DashboardStatsCards = ({ requestsData, onFilterChange }: DashboardStatsCardsProps) => {
  // Calcul des stats
  const totalCount = requestsData?.length || 0;
  const pendingCount = requestsData?.filter(r => 
    r.status === "pending" || r.workflow_status === "pending_assignment"
  )?.length || 0;
  const completedCount = requestsData?.filter(r => 
    r.workflow_status === "completed"
  )?.length || 0;
  const lateCount = requestsData?.filter(r => r.isLate)?.length || 0;

  const cards = [
    {
      id: "all",
      title: "Total des demandes",
      value: totalCount,
      icon: <Inbox className="h-4 w-4" />,
      details: "Toutes les demandes"
    },
    {
      id: "pending",
      title: "En attente",
      value: pendingCount,
      icon: <Database className="h-4 w-4" />,
      details: "Demandes à traiter"
    },
    {
      id: "completed",
      title: "Terminées",
      value: completedCount,
      icon: <MailCheck className="h-4 w-4" />,
      details: "Demandes complétées"
    },
    {
      id: "late",
      title: "En retard",
      value: lateCount,
      icon: <Clock className="h-4 w-4" />,
      details: "Demandes en retard"
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.id}
          title={card.title}
          value={card.value}
          icon={card.icon}
          details={card.details}
          onClick={() => onFilterChange(card.id)}
        />
      ))}
    </div>
  );
};
