import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifier si l'utilisateur actuel a accès à une mission spécifique
 */
export const checkMissionAccess = async (missionId: string): Promise<{
  authorized: boolean;
  reason?: string;
  debugInfo?: any;
}> => {
  try {
    // 1. Récupérer la session utilisateur actuelle avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      clearTimeout(timeoutId);
      
      if (sessionError || !session) {
        return {
          authorized: false,
          reason: "Non authentifié",
          debugInfo: sessionError
        };
      }
      
      const userId = session.user.id;
      
      // 2. Vérifier si l'utilisateur peut lire la mission (test de base)
      const { data: mission, error: readError } = await supabase
        .from("missions")
        .select("id, sdr_id")
        .eq("id", missionId)
        .maybeSingle();
      
      if (readError) {
        return {
          authorized: false,
          reason: "Erreur lors de la lecture",
          debugInfo: readError
        };
      }
      
      if (!mission) {
        return {
          authorized: false,
          reason: "Mission introuvable",
        };
      }
      
      // 3. Vérifier si l'utilisateur est le SDR de la mission
      const isSDR = mission.sdr_id === userId;
      
      // 4. Vérifier si l'utilisateur est un admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      
      if (profileError) {
        return {
          authorized: false,
          reason: "Erreur lors de la vérification du rôle",
          debugInfo: profileError
        };
      }
      
      const isAdmin = profile.role === "admin";
      
      // 5. Retourner le résultat
      if (isSDR || isAdmin) {
        return {
          authorized: true,
          reason: isSDR ? "Est le SDR assigné" : "Est administrateur",
          debugInfo: { isSDR, isAdmin, userId, missionSdrId: mission.sdr_id }
        };
      }
      
      return {
        authorized: false,
        reason: "N'est ni le SDR assigné ni un administrateur",
        debugInfo: { isSDR, isAdmin, userId, missionSdrId: mission.sdr_id }
      };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        authorized: false,
        reason: "Délai d'attente dépassé lors de la vérification des autorisations",
        debugInfo: error
      };
    }
    
    return {
      authorized: false,
      reason: "Erreur lors de la vérification des autorisations",
      debugInfo: error
    };
  }
};

/**
 * Vérifier et journaliser les valeurs des IDs pour diagnostiquer les problèmes de comparaison
 */
export const compareIds = (id1: string | null | undefined, id2: string | null | undefined): {
  equal: boolean;
  strictEqual: boolean;
  debugInfo: any;
} => {
  const stringId1 = id1?.toString() || '';
  const stringId2 = id2?.toString() || '';
  
  return {
    equal: stringId1 === stringId2,
    strictEqual: id1 === id2,
    debugInfo: {
      id1: {
        value: id1,
        type: typeof id1,
        length: stringId1.length,
        charCodes: [...stringId1].map(c => c.charCodeAt(0))
      },
      id2: {
        value: id2,
        type: typeof id2,
        length: stringId2.length,
        charCodes: [...stringId2].map(c => c.charCodeAt(0))
      }
    }
  };
};

/**
 * Get user initials from their full name
 */
export const getUserInitials = (name: string | null | undefined): string => {
  if (!name) return "??";
  
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return "??";
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
