
import { AppLayout } from "@/components/layout/AppLayout";

export const RequestDetailsNotFound = () => {
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <p>Cette demande n'existe pas</p>
      </div>
    </AppLayout>
  );
};
