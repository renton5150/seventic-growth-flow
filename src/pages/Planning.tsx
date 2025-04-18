
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlanningHeader } from "@/components/planning/PlanningHeader";
import { PlanningGrid } from "@/components/planning/PlanningGrid";
import { useQuery } from "@tanstack/react-query";
import { getAllMissions, getMissionsByUserId } from "@/services/missions-service";

const Planning = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', user?.id, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        return await getAllMissions();
      } else if (user?.id) {
        return await getMissionsByUserId(user.id);
      }
      return [];
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Chargement du planning...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PlanningHeader />
        <PlanningGrid missions={missions} />
      </div>
    </AppLayout>
  );
};

export default Planning;
