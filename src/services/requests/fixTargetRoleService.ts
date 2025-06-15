
import { supabase } from "@/integrations/supabase/client";

/**
 * Service pour corriger les target_role manquants des demandes existantes
 */
export const fixTargetRoleService = {
  /**
   * Met à jour toutes les demandes de type 'database' et 'linkedin' 
   * pour leur assigner target_role = 'growth'
   */
  async fixDatabaseAndLinkedInRequests(): Promise<{ 
    success: boolean; 
    updatedCount: number; 
    error?: string 
  }> {
    try {
      console.log("🔧 [FixTargetRole] Correction des target_role pour database et linkedin...");
      
      // Mettre à jour les demandes de type 'database' et 'linkedin' avec target_role NULL
      const { data, error } = await supabase
        .from('requests')
        .update({ 
          target_role: 'growth',
          last_updated: new Date().toISOString()
        })
        .in('type', ['database', 'linkedin'])
        .is('target_role', null)
        .select('id, type, title, created_by, created_by_profile:profiles!requests_created_by_fkey(name)');

      if (error) {
        console.error("🔧 [FixTargetRole] Erreur:", error);
        return {
          success: false,
          updatedCount: 0,
          error: error.message
        };
      }

      const updatedCount = data?.length || 0;
      console.log(`🔧 [FixTargetRole] ✅ ${updatedCount} demandes mises à jour`);
      
      if (updatedCount > 0) {
        console.log("🔧 [FixTargetRole] Demandes mises à jour:", data.map(d => ({
          id: d.id.substring(0, 8),
          type: d.type,
          title: d.title,
          sdr: d.created_by_profile?.name || 'Inconnu'
        })));
      }

      return {
        success: true,
        updatedCount
      };
    } catch (error) {
      console.error("🔧 [FixTargetRole] Erreur inattendue:", error);
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  },

  /**
   * Vérifie le statut des target_role dans la base
   */
  async checkTargetRoleStatus(): Promise<{
    database: { total: number; withTargetRole: number; withoutTargetRole: number };
    linkedin: { total: number; withTargetRole: number; withoutTargetRole: number };
    email: { total: number; withTargetRole: number; withoutTargetRole: number };
  }> {
    try {
      console.log("🔍 [FixTargetRole] Vérification du statut des target_role...");

      // Compter les demandes par type et target_role
      const { data: allRequests, error } = await supabase
        .from('requests')
        .select('type, target_role, created_by, created_by_profile:profiles!requests_created_by_fkey(name)');

      if (error) {
        console.error("🔍 [FixTargetRole] Erreur:", error);
        throw error;
      }

      const stats = {
        database: { total: 0, withTargetRole: 0, withoutTargetRole: 0 },
        linkedin: { total: 0, withTargetRole: 0, withoutTargetRole: 0 },
        email: { total: 0, withTargetRole: 0, withoutTargetRole: 0 }
      };

      console.log("🔍 [FixTargetRole] Analyse de", allRequests?.length, "demandes totales");

      allRequests?.forEach(req => {
        const sdrName = req.created_by_profile?.name || 'Inconnu';
        
        if (req.type === 'database') {
          stats.database.total++;
          if (req.target_role) {
            stats.database.withTargetRole++;
          } else {
            stats.database.withoutTargetRole++;
            console.log(`🔍 [FixTargetRole] Database sans target_role trouvée - SDR: ${sdrName}`);
          }
        } else if (req.type === 'linkedin') {
          stats.linkedin.total++;
          if (req.target_role) {
            stats.linkedin.withTargetRole++;
          } else {
            stats.linkedin.withoutTargetRole++;
            console.log(`🔍 [FixTargetRole] LinkedIn sans target_role trouvée - SDR: ${sdrName}`);
          }
        } else if (req.type === 'email') {
          stats.email.total++;
          if (req.target_role) {
            stats.email.withTargetRole++;
          } else {
            stats.email.withoutTargetRole++;
          }
        }
      });

      console.log("🔍 [FixTargetRole] Statistiques détaillées:", stats);
      return stats;
    } catch (error) {
      console.error("🔍 [FixTargetRole] Erreur lors de la vérification:", error);
      throw error;
    }
  },

  /**
   * Force la correction immédiate de TOUTES les demandes database/linkedin sans target_role
   */
  async forceFixAllRequests(): Promise<{ 
    success: boolean; 
    updatedCount: number; 
    error?: string 
  }> {
    try {
      console.log("🚨 [FixTargetRole] CORRECTION FORCÉE - Mise à jour de TOUTES les demandes database/linkedin...");
      
      // Forcer la mise à jour de TOUTES les demandes database et linkedin sans target_role
      const { data, error } = await supabase
        .from('requests')
        .update({ 
          target_role: 'growth',
          last_updated: new Date().toISOString()
        })
        .in('type', ['database', 'linkedin'])
        .or('target_role.is.null,target_role.neq.growth')
        .select('id, type, title, created_by, created_by_profile:profiles!requests_created_by_fkey(name)');

      if (error) {
        console.error("🚨 [FixTargetRole] Erreur lors de la correction forcée:", error);
        return {
          success: false,
          updatedCount: 0,
          error: error.message
        };
      }

      const updatedCount = data?.length || 0;
      console.log(`🚨 [FixTargetRole] ✅ CORRECTION FORCÉE: ${updatedCount} demandes mises à jour`);
      
      if (updatedCount > 0) {
        console.log("🚨 [FixTargetRole] Demandes corrigées:", data.map(d => ({
          id: d.id.substring(0, 8),
          type: d.type,
          title: d.title,
          sdr: d.created_by_profile?.name || 'Inconnu'
        })));
      }

      return {
        success: true,
        updatedCount
      };
    } catch (error) {
      console.error("🚨 [FixTargetRole] Erreur lors de la correction forcée:", error);
      return {
        success: false,
        updatedCount: 0,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  }
};
