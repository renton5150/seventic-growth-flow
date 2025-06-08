
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { fetchUserStatistics } from "@/services/admin/userStatisticsService";

export const AdminStatsSummary = () => {
  const { data: usersWithStats = [], isLoading, error } = useQuery({
    queryKey: ['admin-stats-summary-vraiment-corrigee'],
    queryFn: fetchUserStatistics,
    refetchInterval: 30000,
  });

  console.log("[AdminStatsSummary] 🔄 Données des statistiques VRAIMENT CORRIGÉES:", usersWithStats);

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

  // Calcul des totaux à partir des données utilisateur VRAIMENT CORRIGÉES
  const totalUsers = usersWithStats.length;
  const totalPending = usersWithStats.reduce((sum, user) => sum + user.stats.pending, 0);
  const totalCompleted = usersWithStats.reduce((sum, user) => sum + user.stats.completed, 0);
  const totalLate = usersWithStats.reduce((sum, user) => sum + user.stats.late, 0);

  console.log("[AdminStatsSummary] 📊 TOTAUX CALCULÉS VRAIMENT CORRIGÉS:", {
    totalUsers,
    totalPending,
    totalCompleted,
    totalLate
  });

  const stats = [
    {
      title: "Utilisateurs",
      value: totalUsers,
      description: `${usersWithStats.filter(u => u.role === 'sdr').length} SDR, ${usersWithStats.filter(u => u.role === 'growth').length} Growth`,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "En attente",
      value: totalPending,
      description: "Demandes à traiter",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Terminées",
      value: totalCompleted,
      description: "Demandes complétées",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "En retard",
      value: totalLate,
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
