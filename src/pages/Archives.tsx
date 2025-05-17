
import { AppLayout } from "@/components/layout/AppLayout";
import { useArchiveRequests } from "@/hooks/useArchiveRequests";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestsTable } from "@/components/dashboard/requests-table/RequestsTable";

const Archives = () => {
  const { 
    archivedRequests, 
    allArchivedRequests,
    isLoading, 
    activeTab, 
    setActiveTab, 
    isSDR, 
    isAdmin 
  } = useArchiveRequests();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Archives</h1>
          <p className="mt-2 text-gray-500">
            Consultez toutes les demandes terminées.
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <p>Chargement des archives...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {allArchivedRequests.length} {allArchivedRequests.length > 1 ? 'demandes archivées' : 'demande archivée'}
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-4 h-auto p-1">
                <TabsTrigger value="all" className="py-2">
                  Toutes
                </TabsTrigger>
                <TabsTrigger value="email" className="py-2">
                  Email
                </TabsTrigger>
                <TabsTrigger value="database" className="py-2">
                  Base de données
                </TabsTrigger>
                <TabsTrigger value="linkedin" className="py-2">
                  LinkedIn
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                <RequestsTable 
                  requests={archivedRequests} 
                  showSdr={!isSDR}
                  isSDR={isSDR}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Archives;
