
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

const MissionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Détails de la mission</h1>
        <p className="text-muted-foreground">
          Mission ID: {id}
        </p>
        <p className="text-muted-foreground">
          Les détails de la mission seront implémentés prochainement.
        </p>
      </div>
    </AppLayout>
  );
};

export default MissionDetailsPage;
