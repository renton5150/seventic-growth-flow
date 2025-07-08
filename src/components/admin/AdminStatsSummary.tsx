
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { fetchGlobalStatistics } from "@/services/admin/userStatisticsService";
import { DateRangeFilter, DateRange } from "./DateRangeFilter";

export const AdminStatsSummary = () => {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const navigate = useNavigate();

  const { data: globalStats, isLoading, error } = useQuery({
    queryKey: ['admin-global-stats-with-date-filter', dateRange],
    queryFn: () => fetchGlobalStatistics(dateRange),
    refetchInterval: 30000,
  });

  console.log("[AdminStatsSummary] 🔄 Statistiques globales avec filtre date:", { dateRange, globalStats });

  const handleStatClick = (filterType: string) => {
    console.log(`[AdminStatsSummary] 🖱️ Clic sur statistique: ${filterType}`);
    
    const navigationState = {
      filterType,
      dateRange,
      fromAdmin: true
    };

    switch (filterType) {
      case 'pending':
        navigate("/growth-dashboard", { 
          state: { 
            ...navigationState,
            defaultFilter: 'pending',
            userName: "Demandes en attente"
          } 
        });
        break;
      case 'completed':
        navigate("/archives", { 
          state: { 
            ...navigationState,
            defaultFilter: 'completed',
            userName: "Demandes terminées"
          } 
        });
        break;
      case 'late':
        navigate("/growth-dashboard", { 
          state: { 
            ...navigationState,
            defaultFilter: 'late',
            userName: "Demandes en retard"
          } 
        });
        break;
      case 'users':
        navigate("/admin/users");
        break;
      default:
        navigate("/growth-dashboard", { 
          state: { 
            ...navigationState,
            defaultFilter: 'all',
            userName: "Toutes les demandes"
          } 
        });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Statistiques globales</h2>
          <DateRangeFilter 
            onDateRangeChange={setDateRange} 
            currentRange={dateRange} 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error("[AdminStatsSummary] ❌ Erreur:", error);
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Statistiques globales</h2>
          <DateRangeFilter 
            onDateRangeChange={setDateRange} 
            currentRange={dateRange} 
          />
        </div>
        <div className="text-red-500">Erreur lors du chargement des statistiques: {error.message}</div>
      </div>
    );
  }

  const stats = [
    {
      title: "Utilisateurs",
      value: globalStats?.totalUsers || 0,
      description: "Utilisateurs actifs",
      icon: Users,
      color: "text-blue-600",
      filterType: "users"
    },
    {
      title: "En attente",
      value: globalStats?.totalPending || 0,
      description: "Demandes à traiter",
      icon: Clock,
      color: "text-orange-600",
      filterType: "pending"
    },
    {
      title: "Terminées",
      value: globalStats?.totalCompleted || 0,
      description: "Demandes complétées",
      icon: CheckCircle,
      color: "text-green-600",
      filterType: "completed"
    },
    {
      title: "En retard",
      value: globalStats?.totalLate || 0,
      description: "Demandes en retard",
      icon: AlertCircle,
      color: "text-red-600",
      filterType: "late"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Statistiques globales</h2>
        <DateRangeFilter 
          onDateRangeChange={setDateRange} 
          currentRange={dateRange} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index}
              className="cursor-pointer transition-all hover:shadow-md hover:bg-accent/10"
              onClick={() => handleStatClick(stat.filterType)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {dateRange && (
        <div className="text-xs text-muted-foreground">
          Filtré par date de création des demandes
        </div>
      )}
    </div>
  );
};
