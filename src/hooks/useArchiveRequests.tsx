
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";

export const useArchiveRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<Request[]>([]);
  const queryClient = useQueryClient();

  const isSDR = user?.role === "sdr";
  const isGrowth = user?.role === "growth";
  const isAdmin = user?.role === "admin";

  // Récupérer les requêtes terminées ET annulées
  const { data: archivedRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['archives-requests', user?.id, isSDR],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("Récupération des requêtes archivées");
      try {
        // Utilisation de la vue requests_with_missions
        let query = supabase
          .from('requests_with_missions')
          .select('*')
          .in('workflow_status', ['completed', 'canceled']); // Inclure completed ET canceled
        
        // Si c'est un SDR, filtrer pour ne montrer que ses propres requêtes
        if (isSDR) {
          console.log("SDR détecté - Filtrage des archives pour l'utilisateur:", user.id);
          query = query.eq('created_by', user.id);
        }
        
        const { data, error } = await query;
          
        if (error) {
          console.error("Erreur lors de la récupération des archives:", error);
          return [];
        }
        
        console.log(`Requêtes archivées récupérées: ${data.length}`);
        
        // Traiter les données avec formatRequestFromDb - et attendre les résultats des promesses
        const formattedRequests = await Promise.all(data.map((req: any) => formatRequestFromDb(req)));
        return formattedRequests;
      } catch (err) {
        console.error("Exception lors de la récupération des archives:", err);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  useEffect(() => {
    if (isLoading) return;

    setRequests(archivedRequests || []);
  }, [archivedRequests, isLoading]);

  // Fonction pour filtrer les requêtes en fonction de l'onglet actif
  const getFilteredRequests = useCallback(() => {
    console.log(`[DEBUG] useArchiveRequests - Filtrage des archives avec activeTab: ${activeTab}`);
    
    return requests.filter((request) => {
      if (activeTab === "all") return true;
      if (activeTab === "email") return request.type === "email";
      if (activeTab === "database") return request.type === "database";
      if (activeTab === "linkedin") return request.type === "linkedin";
      return false;
    });
  }, [activeTab, requests]);

  // Calcul des requêtes filtrées en fonction de l'onglet actif
  const filteredRequests = getFilteredRequests();

  return {
    archivedRequests: filteredRequests,
    allArchivedRequests: requests,
    isLoading,
    activeTab,
    setActiveTab,
    isSDR,
    isGrowth,
    isAdmin,
    refetch
  };
};
