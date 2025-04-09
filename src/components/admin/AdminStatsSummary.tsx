
import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllRequests } from "@/services/requestService";
import { getAllUsers } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";

export type StatFilter = "all" | "pending" | "completed" | "late";

interface AdminStatsSummaryProps {
  onFilterChange?: (filter: StatFilter) => void;
  currentFilter: StatFilter;
}

export const AdminStatsSummary = ({ onFilterChange, currentFilter }: AdminStatsSummaryProps) => {
  const { data: requests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: getAllRequests
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: getAllUsers
  });

  const pendingRequests = requests.filter(r => r.status === "pending").length;
  const completedRequests = requests.filter(r => r.status === "completed").length;
  const lateRequests = requests.filter(r => r.isLate).length;
  
  const sdrCount = users.filter(u => u.role === "sdr").length;
  const growthCount = users.filter(u => u.role === "growth").length;

  const handleFilterChange = (filter: StatFilter) => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  if (isLoadingRequests || isLoadingUsers) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Utilisateurs"
        value={users.length}
        icon={<Users size={24} className="text-blue-500" />}
        details={`${sdrCount} SDR, ${growthCount} Growth`}
        className={currentFilter === "all" ? "border-blue-500 bg-blue-50" : ""}
        onClick={() => handleFilterChange("all")}
      />
      <StatCard
        title="En attente"
        value={pendingRequests}
        icon={<Clock size={24} className="text-status-pending" />}
        className={currentFilter === "pending" ? "border-amber-500 bg-amber-50" : ""}
        onClick={() => handleFilterChange("pending")}
      />
      <StatCard
        title="Terminées"
        value={completedRequests}
        icon={<CheckCircle size={24} className="text-status-completed" />}
        className={currentFilter === "completed" ? "border-green-500 bg-green-50" : ""}
        onClick={() => handleFilterChange("completed")}
      />
      <StatCard
        title="En retard"
        value={lateRequests}
        icon={<AlertCircle size={24} className="text-status-late" />}
        className={currentFilter === "late" ? "border-red-500 bg-red-50" : ""}
        onClick={() => handleFilterChange("late")}
      />
    </div>
  );
};
