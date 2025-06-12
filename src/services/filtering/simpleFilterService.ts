
import { SimpleRequest } from "@/services/requests/simpleRequestService";

export type SimpleFilterType = 'all' | 'in_progress' | 'completed' | 'late';

export interface SimpleFilterCounts {
  all: number;
  in_progress: number;
  completed: number;
  late: number;
}

export class SimpleFilterService {
  private userId: string | undefined;
  
  constructor(userId: string | undefined) {
    this.userId = userId;
    console.log(`🔍 [DIAGNOSTIC] SimpleFilterService initialisé pour userId: ${userId}`);
  }
  
  /**
   * Filtrage ULTRA-SIMPLE avec logs détaillés
   */
  filterRequests(filterType: SimpleFilterType, allRequests: SimpleRequest[]): SimpleRequest[] {
    console.log(`🔍 [DIAGNOSTIC] Début filtrage "${filterType}" sur ${allRequests.length} demandes`);
    console.log("🔍 [DIAGNOSTIC] IDs des demandes à filtrer:", allRequests.map(r => r.id));
    
    if (allRequests.length === 0) {
      console.warn("⚠️ [DIAGNOSTIC] Aucune demande à filtrer - tableau vide en entrée");
      return [];
    }
    
    let filtered: SimpleRequest[] = [];
    
    try {
      switch (filterType) {
        case 'all':
          filtered = allRequests;
          console.log("🔍 [DIAGNOSTIC] Filtre 'all' - toutes les demandes conservées");
          break;
          
        case 'in_progress':
          filtered = allRequests.filter(req => {
            const match = req.workflow_status === 'in_progress';
            console.log(`🔍 [DIAGNOSTIC] Demande ${req.id} - workflow_status: ${req.workflow_status}, match in_progress: ${match}`);
            return match;
          });
          break;
          
        case 'completed':
          filtered = allRequests.filter(req => {
            const match = req.workflow_status === 'completed';
            console.log(`🔍 [DIAGNOSTIC] Demande ${req.id} - workflow_status: ${req.workflow_status}, match completed: ${match}`);
            return match;
          });
          break;
          
        case 'late':
          filtered = allRequests.filter(req => {
            console.log(`🔍 [DIAGNOSTIC] Demande ${req.id} - isLate: ${req.isLate}`);
            return req.isLate;
          });
          break;
          
        default:
          console.warn(`⚠️ [DIAGNOSTIC] Type de filtre inconnu: ${filterType}`);
          filtered = allRequests;
      }
      
      console.log(`✅ [DIAGNOSTIC] Filtrage "${filterType}" terminé: ${filtered.length} demandes`);
      console.log("🔍 [DIAGNOSTIC] IDs des demandes filtrées:", filtered.map(r => r.id));
      
    } catch (filterError) {
      console.error("❌ [DIAGNOSTIC] Erreur lors du filtrage:", filterError);
      filtered = allRequests; // Retourner toutes les demandes en cas d'erreur
    }
    
    return filtered;
  }
  
  /**
   * Calcul des compteurs avec logs
   */
  calculateCounts(allRequests: SimpleRequest[]): SimpleFilterCounts {
    console.log(`🔍 [DIAGNOSTIC] Calcul des compteurs pour ${allRequests.length} demandes`);
    
    const counts = {
      all: allRequests.length,
      in_progress: this.filterRequests('in_progress', allRequests).length,
      completed: this.filterRequests('completed', allRequests).length,
      late: this.filterRequests('late', allRequests).length,
    };
    
    console.log("🔍 [DIAGNOSTIC] Compteurs calculés:", counts);
    return counts;
  }
}
