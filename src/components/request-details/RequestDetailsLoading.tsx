
import { AppLayout } from "@/components/layout/AppLayout";

export const RequestDetailsLoading = () => {
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <p>Chargement des détails de la demande...</p>
      </div>
    </AppLayout>
  );
};
