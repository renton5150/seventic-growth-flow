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

    let query = supabase
      .from('requests_with_missions')
      .select('*')
      .eq('id', requestId);

    // Si c'est un SDR, filtrer pour ne montrer que ses propres demandes
    if (isSDR) {
      console.log(`[getRequestDetails] 🔒 Filtre SDR appliqué pour: ${userId}`);
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error(`[getRequestDetails] ❌ Erreur DB:`, error);
      return null;
    }

    if (!data) {
      console.warn(`[getRequestDetails] ⚠️ Aucune demande trouvée pour: ${requestId}`);
      return null;
    }

    console.log(`[getRequestDetails] ✅ Demande récupérée:`, data.title);
    const formattedRequest = await formatRequestFromDb(data);
    return formattedRequest;
    
  } catch (error) {
    console.error(`[getRequestDetails] 💥 Exception:`, error);
    return null;
  }
};
