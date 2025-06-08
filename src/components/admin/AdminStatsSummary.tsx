
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { fetchGlobalStatistics } from "@/services/admin/userStatisticsService";

export const AdminStatsSummary = () => {
  const { data: globalStats, isLoading, error } = useQuery({
    queryKey: ['admin-global-stats-corrigees'],
    queryFn: fetchGlobalStatistics,
    refetchInterval: 30000,
  });

  console.log("[AdminStatsSummary] 🔄 Statistiques globales CORRIGÉES:", globalStats);

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    console.error("[AdminStatsSummary] ❌ Erreur:", error);
    return (
      <div className="text-red-500">Erreur lors du chargement des statistiques: {error.message}</div>
    );
  }

  const stats = [
    {
      title: "Utilisateurs",
      value: globalStats?.totalUsers || 0,
      description: "Utilisateurs actifs",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "En attente",
      value: globalStats?.totalPending || 0,
      description: "Demandes à traiter",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Terminées",
      value: globalStats?.totalCompleted || 0,
      description: "Demandes complétées",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "En retard",
      value: globalStats?.totalLate || 0,
      description: "Demandes en retard",
      icon: AlertCircle,
      color: "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
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
  );
};
