
import { Request } from "@/types/types";

export interface FilterCounts {
  all: number;
  to_assign: number;
  my_assignments: number;
  pending: number;
  inprogress: number;
  completed: number;
  late: number;
}

export class GrowthFilterService {
  private userId: string | undefined;
  
  constructor(userId: string | undefined) {
    this.userId = userId;
  }
  
  /**
   * Filtrer les demandes actives (exclut completed et canceled)
   */
  getActiveRequests(allRequests: Request[]): Request[] {
    return allRequests.filter(req => 
      req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
    );
  }
  
  /**
   * Filtrage unique et centralisé pour TOUS les cas - VERSION CORRIGÉE
   */
  filterRequests(filterType: string, allRequests: Request[]): Request[] {
    console.log(`[GrowthFilterService] 🔍 Filtrage "${filterType}" sur ${allRequests.length} demandes totales`);
    console.log(`[GrowthFilterService] 👤 User ID: ${this.userId}`);
    
    const activeRequests = this.getActiveRequests(allRequests);
    console.log(`[GrowthFilterService] 📊 Demandes actives: ${activeRequests.length}`);
    
    let filtered: Request[] = [];
    
    switch (filterType) {
      case 'all':
        filtered = activeRequests;
        console.log(`[GrowthFilterService] ✅ ALL: ${filtered.length} demandes actives`);
        break;
        
      case 'to_assign':
        // CORRECTION: Logique plus stricte pour les demandes à assigner
        filtered = activeRequests.filter(req => {
          const isUnassigned = !req.assigned_to || 
                              req.assigned_to === '' || 
                              req.assigned_to === null || 
                              req.assigned_to === 'Non assigné';
          
          console.log(`[GrowthFilterService] 🔍 Request ${req.id}: assigned_to="${req.assigned_to}", isUnassigned=${isUnassigned}`);
          return isUnassigned;
        });
        console.log(`[GrowthFilterService] ✅ TO_ASSIGN: ${filtered.length} demandes non assignées`);
        break;
        
      case 'my_assignments':
        // CORRECTION: Logique simplifiée pour éviter les doublons
        filtered = activeRequests.filter(req => {
          const isMyAssignment = req.assigned_to === this.userId;
          console.log(`[GrowthFilterService] 🔍 Request ${req.id}: assigned_to="${req.assigned_to}", userId="${this.userId}", isMyAssignment=${isMyAssignment}`);
          return isMyAssignment;
        });
        console.log(`[GrowthFilterService] ✅ MY_ASSIGNMENTS: ${filtered.length} demandes assignées à moi`);
        break;
        
      case 'pending':
        filtered = activeRequests.filter(req => {
          const isPending = req.status === "pending" || req.workflow_status === "pending_assignment";
          console.log(`[GrowthFilterService] 🔍 Request ${req.id}: status="${req.status}", workflow_status="${req.workflow_status}", isPending=${isPending}`);
          return isPending;
        });
        console.log(`[GrowthFilterService] ✅ PENDING: ${filtered.length} demandes en attente`);
        break;
        
      case 'inprogress':
        filtered = activeRequests.filter(req => {
          const isInProgress = req.workflow_status === "in_progress";
          console.log(`[GrowthFilterService] 🔍 Request ${req.id}: workflow_status="${req.workflow_status}", isInProgress=${isInProgress}`);
          return isInProgress;
        });
        console.log(`[GrowthFilterService] ✅ INPROGRESS: ${filtered.length} demandes en cours`);
        break;
        
      case 'completed':
        // Pour completed, on utilise TOUTES les demandes (pas juste actives)
        filtered = allRequests.filter(req => {
          const isCompleted = req.workflow_status === "completed";
          console.log(`[GrowthFilterService] 🔍 Request ${req.id}: workflow_status="${req.workflow_status}", isCompleted=${isCompleted}`);
          return isCompleted;
        });
        console.log(`[GrowthFilterService] ✅ COMPLETED: ${filtered.length} demandes terminées`);
        break;
        
      case 'late':
        filtered = activeRequests.filter(req => {
          console.log(`[GrowthFilterService] 🔍 Request ${req.id}: isLate=${req.isLate}`);
          return req.isLate;
        });
        console.log(`[GrowthFilterService] ✅ LATE: ${filtered.length} demandes en retard`);
        break;
        
      default:
        filtered = activeRequests;
        console.log(`[GrowthFilterService] ⚠️ DEFAULT: ${filtered.length} demandes (fallback)`);
    }
    
    // LOG DÉTAILLÉ DES IDs POUR TRAÇAGE
    const filteredIds = filtered.map(r => r.id);
    console.log(`[GrowthFilterService] 🎯 IDs filtrés pour "${filterType}":`, filteredIds);
    
    return filtered;
  }
  
  /**
   * Calculer tous les compteurs en une seule fois
   */
  calculateCounts(allRequests: Request[]): FilterCounts {
    console.log(`[GrowthFilterService] 📊 Calcul des compteurs sur ${allRequests.length} demandes`);
    
    const activeRequests = this.getActiveRequests(allRequests);
    
    const counts: FilterCounts = {
      all: activeRequests.length,
      to_assign: this.filterRequests('to_assign', allRequests).length,
      my_assignments: this.filterRequests('my_assignments', allRequests).length,
      pending: this.filterRequests('pending', allRequests).length,
      inprogress: this.filterRequests('inprogress', allRequests).length,
      completed: this.filterRequests('completed', allRequests).length,
      late: this.filterRequests('late', allRequests).length,
    };
    
    console.log("[GrowthFilterService] 📊 Compteurs calculés:", counts);
    
    return counts;
  }
}
