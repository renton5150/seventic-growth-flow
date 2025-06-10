
import { supabase } from "@/integrations/supabase/client";
import { Request } from "@/types/types";
import { formatRequestFromDb } from "@/utils/requestFormatters";

interface FetchRequestsOptions {
  assignedTo?: string | null;
  createdBy?: string;
  workflowStatus?: string;
  workflowStatusNot?: string;
  assignedToIsNull?: boolean;
  assignedToIsNotNull?: boolean;
}

export const fetchRequests = async (options: FetchRequestsOptions = {}): Promise<Request[]> => {
  let query = supabase
    .from('requests_with_missions')
    .select('*');

  if (options.assignedTo) {
    query = query.eq('assigned_to', options.assignedTo);
  }

  if (options.createdBy) {
    query = query.eq('created_by', options.createdBy);
  }

  if (options.workflowStatus) {
    query = query.eq('workflow_status', options.workflowStatus);
  }

  if (options.workflowStatusNot) {
    query = query.neq('workflow_status', options.workflowStatusNot);
  }

  if (options.assignedToIsNull) {
    query = query.is('assigned_to', null);
  }

  if (options.assignedToIsNotNull) {
    query = query.not('assigned_to', 'is', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    return [];
  }

  // Assurez-vous de traiter chaque élément avec formatRequestFromDb
  const formattedRequests = await Promise.all(data.map(async (request: any) => {
    return await formatRequestFromDb(request);
  }));

  return formattedRequests;
};

export const getRequestDetails = async (
  requestId: string, 
  userId: string, 
  isSDR: boolean = false
): Promise<Request | null> => {
  try {
    console.log(`[getRequestDetails] 🔍 Récupération demande: ${requestId} pour user: ${userId} (SDR: ${isSDR})`);
    
    // Vérifier que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      console.error(`[getRequestDetails] ❌ UUID invalide: ${requestId}`);
      return null;
    }

    // Construire la requête avec tous les détails nécessaires
    let query = supabase
      .from('requests_with_missions')
      .select(`
        *,
        missions(id, name, client, sdr_id, description, created_at, start_date, end_date, type, status),
        profiles!requests_created_by_fkey(id, name, email),
        assigned_to_profile:profiles!requests_assigned_to_fkey(id, name, email)
      `)
      .eq('id', requestId);

    // Pour les demandes archivées (workflow_status = completed ou canceled), 
    // permettre l'accès à tous les utilisateurs pour consultation
    // Sinon, filtrer par SDR si nécessaire
    if (isSDR) {
      // Vérifier d'abord si c'est une demande archivée
      const { data: requestCheck } = await supabase
        .from('requests')
        .select('workflow_status, created_by')
        .eq('id', requestId)
        .single();
        
      if (requestCheck) {
        const isArchived = requestCheck.workflow_status === 'completed' || requestCheck.workflow_status === 'canceled';
        
        // Si ce n'est pas archivé et que c'est un SDR, filtrer par créateur
        if (!isArchived) {
          console.log(`[getRequestDetails] 🔒 Filtre SDR appliqué pour demande active: ${userId}`);
          query = query.eq('created_by', userId);
        } else {
          console.log(`[getRequestDetails] 📚 Demande archivée - accès libre pour consultation`);
        }
      }
    }

    const { data, error } = await query.single();

    if (error) {
      console.error(`[getRequestDetails] ❌ Erreur DB:`, error);
      // Si pas trouvé avec le filtre SDR, essayer sans filtre pour les archives
      if (isSDR && error.code === 'PGRST116') {
        console.log(`[getRequestDetails] 🔄 Retry sans filtre SDR pour archives`);
        const { data: retryData, error: retryError } = await supabase
          .from('requests_with_missions')
          .select(`
            *,
            missions(id, name, client, sdr_id, description, created_at, start_date, end_date, type, status),
            profiles!requests_created_by_fkey(id, name, email),
            assigned_to_profile:profiles!requests_assigned_to_fkey(id, name, email)
          `)
          .eq('id', requestId)
          .single();
          
        if (retryError) {
          console.error(`[getRequestDetails] ❌ Erreur retry:`, retryError);
          return null;
        }
        
        // Vérifier que c'est bien une demande archivée avant de retourner
        if (retryData && (retryData.workflow_status === 'completed' || retryData.workflow_status === 'canceled')) {
          console.log(`[getRequestDetails] ✅ Demande archivée récupérée via retry`);
          const formattedRequest = await formatRequestFromDb(retryData);
          return formattedRequest;
        } else {
          console.log(`[getRequestDetails] ❌ Demande non archivée - accès refusé pour SDR`);
          return null;
        }
      }
      return null;
    }

    if (!data) {
      console.warn(`[getRequestDetails] ⚠️ Aucune demande trouvée pour: ${requestId}`);
      return null;
    }

    console.log(`[getRequestDetails] ✅ Demande récupérée:`, data.title);
    console.log(`[getRequestDetails] 📋 Détails complets:`, data);
    
    const formattedRequest = await formatRequestFromDb(data);
    
    // Log des détails formatés pour debug
    console.log(`[getRequestDetails] 🔍 Demande formatée:`, {
      id: formattedRequest.id,
      title: formattedRequest.title,
      type: formattedRequest.type,
      details: formattedRequest.details,
      hasTemplate: formattedRequest.type === 'email' && !!(formattedRequest as any).template,
      hasDatabase: formattedRequest.type === 'email' && !!(formattedRequest as any).database,
      hasBlacklist: formattedRequest.type === 'email' && !!(formattedRequest as any).blacklist
    });
    
    return formattedRequest;
    
  } catch (error) {
    console.error(`[getRequestDetails] 💥 Exception:`, error);
    return null;
  }
};
