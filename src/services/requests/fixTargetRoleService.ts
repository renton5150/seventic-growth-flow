
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
        .select('id, type, title');

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
        console.log("🔧 [FixTargetRole] Demandes mises à jour:", data);
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
        .select('type, target_role');

      if (error) {
        console.error("🔍 [FixTargetRole] Erreur:", error);
        throw error;
      }

      const stats = {
        database: { total: 0, withTargetRole: 0, withoutTargetRole: 0 },
        linkedin: { total: 0, withTargetRole: 0, withoutTargetRole: 0 },
        email: { total: 0, withTargetRole: 0, withoutTargetRole: 0 }
      };

      allRequests?.forEach(req => {
        if (req.type === 'database') {
          stats.database.total++;
          if (req.target_role) {
            stats.database.withTargetRole++;
          } else {
            stats.database.withoutTargetRole++;
          }
        } else if (req.type === 'linkedin') {
          stats.linkedin.total++;
          if (req.target_role) {
            stats.linkedin.withTargetRole++;
          } else {
            stats.linkedin.withoutTargetRole++;
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

      console.log("🔍 [FixTargetRole] Statistiques:", stats);
      return stats;
    } catch (error) {
      console.error("🔍 [FixTargetRole] Erreur lors de la vérification:", error);
      throw error;
    }
  }
};
