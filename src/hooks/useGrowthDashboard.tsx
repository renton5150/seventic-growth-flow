import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useGrowthDashboard(defaultTab?: string) {
  const { user } = useAuth();
  
  // Définir l'onglet initial avec une logique plus robuste
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Utiliser defaultTab s'il est fourni, sinon "to_assign" par défaut
    return defaultTab || "to_assign";
  });
  
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  
  // Mettre à jour l'activeTab si defaultTab change
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['growth-requests'],
    queryFn: async () => {
      if (!user) return [];
      
      // Récupérer toutes les requêtes pour la vue générale
      const { data: allRequests, error } = await supabase
        .from('requests')
        .select('*, profiles:created_by(name, avatar), assigned_profile:assigned_to(name, avatar)')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération des requêtes:", error);
        return [];
      }
      
      return allRequests.map(formatRequestFromDb);
    },
    enabled: !!(user?.role === "growth" || user?.role === "admin")
  });
  
  // Requêtes pour "À affecter" - spécifique aux nouvelles fonctionnalités
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('requests')
        .select('*, profiles:created_by(name, avatar)')
        .eq('workflow_status', 'pending_assignment')
        .eq('target_role', 'growth')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération des requêtes à affecter:", error);
        return [];
      }
      
      return data.map(formatRequestFromDb);
    },
    enabled: !!(user?.role === "growth" || user?.role === "admin")
  });
  
  // Requêtes pour "Mes assignations" - spécifique aux nouvelles fonctionnalités
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('requests')
        .select('*, profiles:created_by(name, avatar)')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération de mes assignations:", error);
        return [];
      }
      
      return data.map(formatRequestFromDb);
    },
    enabled: !!(user?.role === "growth" || user?.role === "admin")
  });
  
  const filteredRequests = requests.filter(request => {
    if (activeTab === "all") return true;
    if (activeTab === "to_assign") {
      return request.workflow_status === "pending_assignment" && request.target_role === "growth";
    }
    if (activeTab === "my_assignments") {
      return request.assigned_to === user?.id;
    }
    if (activeTab === "pending") return request.status === "pending";
    if (activeTab === "inprogress") return request.status === "inprogress";
    if (activeTab === "completed") return request.status === "completed";
    if (activeTab === "email") return request.type === "email";
    if (activeTab === "database") return request.type === "database";
    if (activeTab === "linkedin") return request.type === "linkedin";
    return false;
  });
  
  // Fonction pour prendre en charge une requête (nouveau)
  const assignRequestToMe = async (requestId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({
          assigned_to: user.id,
          workflow_status: 'in_progress',
          last_updated: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (error) {
        console.error("Erreur lors de la prise en charge de la requête:", error);
        return false;
      }
      
      // Rafraîchir les données après mise à jour
      refetch();
      refetchToAssign();
      refetchMyAssignments();
      return true;
    } catch (err) {
      console.error("Erreur lors de l'assignation de la requête:", err);
      return false;
    }
  };
  
  // Fonction pour mettre à jour le statut d'une requête (nouveau)
  const updateRequestWorkflowStatus = async (requestId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({
          workflow_status: newStatus,
          last_updated: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (error) {
        console.error("Erreur lors de la mise à jour du statut de la requête:", error);
        return false;
      }
      
      // Rafraîchir les données après mise à jour
      refetch();
      refetchToAssign();
      refetchMyAssignments();
      return true;
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      return false;
    }
  };
  
  const handleOpenEditDialog = (request: Request) => {
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  };
  
  const handleOpenCompletionDialog = (request: Request) => {
    setSelectedRequest(request);
    setIsCompletionDialogOpen(true);
  };
  
  const handleRequestUpdated = () => {
    refetch();
    refetchToAssign();
    refetchMyAssignments();
  };
  
  // Fonction utilitaire pour formater les requêtes provenant de Supabase
  function formatRequestFromDb(dbRequest: any): Request {
    // Convertit les dates en objets Date
    const createdAt = new Date(dbRequest.created_at);
    const dueDate = new Date(dbRequest.due_date);
    const lastUpdated = new Date(dbRequest.last_updated || dbRequest.created_at);
    
    // Vérifie si la requête est en retard (date d'échéance dépassée et non terminée)
    const isLate = dueDate < new Date() && 
                  (dbRequest.workflow_status !== 'completed' && dbRequest.workflow_status !== 'canceled');
    
    // Récupère les détails du SDR créateur si disponibles
    const sdrName = dbRequest.profiles?.name || null;
    
    // Récupère les détails du Growth assigné si disponibles
    const assignedToName = dbRequest.assigned_profile?.name || null;
    
    // Construit l'objet requête formaté
    return {
      id: dbRequest.id,
      title: dbRequest.title,
      type: dbRequest.type,
      missionId: dbRequest.mission_id,
      createdBy: dbRequest.created_by,
      sdrName: sdrName,
      createdAt: createdAt,
      dueDate: dueDate,
      status: dbRequest.status,
      workflow_status: dbRequest.workflow_status || 'pending_assignment',
      target_role: dbRequest.target_role || 'growth',
      assigned_to: dbRequest.assigned_to || null,
      assignedToName: assignedToName,
      lastUpdated: lastUpdated,
      isLate: isLate,
      ...dbRequest.details
    };
  }
  
  return {
    requests,
    toAssignRequests,
    myAssignmentsRequests,
    filteredRequests: activeTab === "to_assign" ? toAssignRequests : 
                     activeTab === "my_assignments" ? myAssignmentsRequests : 
                     filteredRequests,
    isLoading,
    activeTab,
    setActiveTab,
    selectedRequest,
    setSelectedRequest,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCompletionDialogOpen,
    setIsCompletionDialogOpen,
    handleOpenEditDialog,
    handleOpenCompletionDialog,
    handleRequestUpdated,
    assignRequestToMe,
    updateRequestWorkflowStatus
  };
}
