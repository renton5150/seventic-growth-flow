
import { AppLayout } from "@/components/layout/AppLayout";
import { MissionPermissionsDebug } from "@/components/missions/MissionPermissionsDebug";

const PermissionsDebug = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Diagnostic des Permissions</h1>
        <p className="text-muted-foreground">
          Cette page permet de tester les autorisations pour les missions. 
          Utilisez les boutons ci-dessous pour vérifier si vous pouvez modifier vos missions.
        </p>
        
        <MissionPermissionsDebug />
      </div>
    </AppLayout>
  );
};

export default PermissionsDebug;
