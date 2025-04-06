
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabasesList } from "@/components/databases/DatabasesList";
import { DatabaseUploader } from "@/components/databases/DatabaseUploader";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getAllDatabases } from "@/services/databaseService";

const Databases = () => {
  const { user, loading: authLoading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: databases = [], isLoading: databasesLoading, refetch, error } = useQuery({
    queryKey: ['databases'],
    queryFn: getAllDatabases,
    enabled: !!user
  });
  
  const handleDatabaseUploaded = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  const handleDatabaseDeleted = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  const isLoading = authLoading || databasesLoading || isRefreshing;
  
  // Adding useEffect to listen for custom events
  useEffect(() => {
    const handleUploadSuccess = () => {
      handleDatabaseUploaded();
    };
    
    const handleDeleteSuccess = () => {
      handleDatabaseDeleted();
    };
    
    window.addEventListener('database-uploaded', handleUploadSuccess);
    window.addEventListener('database-deleted', handleDeleteSuccess);
    
    return () => {
      window.removeEventListener('database-uploaded', handleUploadSuccess);
      window.removeEventListener('database-deleted', handleDeleteSuccess);
    };
  }, []);
  
  if (authLoading) {
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
        <DatabasesList databases={databases} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
};

export default Databases;
