
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
    console.log("Vérification de l'accès à la mission:", missionId);
    
    // 1. Récupérer la session utilisateur actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("Erreur de session:", sessionError);
      return {
        authorized: false,
        reason: "Non authentifié",
        debugInfo: sessionError
      };
    }
    
    const userId = session.user.id;
    console.log("ID utilisateur:", userId);
    
    // 2. Vérifier si l'utilisateur peut lire la mission (test de base)
    const { data: mission, error: readError } = await supabase
      .from("missions")
      .select("id, sdr_id")
      .eq("id", missionId)
      .maybeSingle();
    
    if (readError) {
      console.error("Erreur lors de la lecture:", readError);
      return {
        authorized: false,
        reason: "Erreur lors de la lecture",
        debugInfo: readError
      };
    }
    
    if (!mission) {
      console.warn("Mission introuvable:", missionId);
      return {
        authorized: false,
        reason: "Mission introuvable",
      };
    }
    
    // 3. Vérifier si l'utilisateur est le SDR de la mission
    const isSDR = mission.sdr_id === userId;
    console.log("Est SDR assigné:", isSDR, "| sdr_id:", mission.sdr_id);
    
    // Comparaison détaillée des IDs
    const idsComparison = compareIds(mission.sdr_id, userId);
    console.log("Comparaison détaillée des IDs:", idsComparison);
    
    // 4. Vérifier si l'utilisateur est un admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    
    if (profileError) {
      console.error("Erreur lors de la vérification du rôle:", profileError);
      return {
        authorized: false,
        reason: "Erreur lors de la vérification du rôle",
        debugInfo: profileError
      };
    }
    
    const isAdmin = profile.role === "admin";
    console.log("Est administrateur:", isAdmin);
    
    // 5. Retourner le résultat
    if (isSDR || isAdmin) {
      console.log("Accès autorisé:", isSDR ? "SDR assigné" : "Administrateur");
      return {
        authorized: true,
        reason: isSDR ? "Est le SDR assigné" : "Est administrateur",
        debugInfo: { isSDR, isAdmin, userId, missionSdrId: mission.sdr_id }
      };
    }
    
    console.warn("Accès refusé: ni SDR ni admin");
    return {
      authorized: false,
      reason: "N'est ni le SDR assigné ni un administrateur",
      debugInfo: { isSDR, isAdmin, userId, missionSdrId: mission.sdr_id }
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la vérification des autorisations:", error);
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
  
  // Vérifier également les versions normalisées (minuscules, sans espaces)
  const normalizedId1 = stringId1.toLowerCase().trim();
  const normalizedId2 = stringId2.toLowerCase().trim();
  
  return {
    equal: stringId1 === stringId2,
    strictEqual: id1 === id2,
    normalizedEqual: normalizedId1 === normalizedId2,
    debugInfo: {
      id1: {
        value: id1,
        type: typeof id1,
        length: stringId1.length,
        charCodes: [...stringId1].map(c => c.charCodeAt(0)),
        normalized: normalizedId1
      },
      id2: {
        value: id2,
        type: typeof id2,
        length: stringId2.length,
        charCodes: [...stringId2].map(c => c.charCodeAt(0)),
        normalized: normalizedId2
      }
    }
  };
};

/**
 * Vérifier si l'utilisateur est connecté
 */
export const checkAuthentication = async (): Promise<{
  authenticated: boolean;
  user?: any;
  error?: any;
}> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        authenticated: false,
        error
      };
    }
    
    if (!data.session) {
      return {
        authenticated: false
      };
    }
    
    return {
      authenticated: true,
      user: data.session.user
    };
  } catch (error) {
    return {
      authenticated: false,
      error
    };
  }
};
