
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabasesList } from "@/components/databases/DatabasesList";
import { DatabaseUploader } from "@/components/databases/DatabaseUploader";
import { useAuth } from "@/contexts/AuthContext";

const Databases = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Chargement...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Gestion des bases de données</h1>
      <div className="space-y-6">
        <DatabaseUploader />
        <DatabasesList />
      </div>
    </AppLayout>
  );
};

export default Databases;
