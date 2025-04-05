
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabaseCreationForm } from "@/components/requests/DatabaseCreationForm";

const DatabaseCreationRequest = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Nouvelle demande de création de base</h1>
        <DatabaseCreationForm />
      </div>
    </AppLayout>
  );
};

export default DatabaseCreationRequest;
