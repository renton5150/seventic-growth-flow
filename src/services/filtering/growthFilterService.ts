
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

export interface SpecialFilters {
  showUnassigned?: boolean;
  sdrFilter?: string;
  growthFilter?: string;
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
   * Appliquer les filtres spéciaux utilisateur
   */
  applySpecialFilters(requests: Request[], specialFilters: SpecialFilters): Request[] {
    let filtered = requests;
    
    // Filtre SDR - afficher les demandes créées par cet utilisateur
    if (specialFilters.sdrFilter) {
      console.log(`[GrowthFilterService] 👤 Application filtre SDR: ${specialFilters.sdrFilter}`);
      filtered = filtered.filter(req => req.createdBy === specialFilters.sdrFilter);
    }
    
    // Filtre Growth - afficher les demandes assignées à cet utilisateur
    if (specialFilters.growthFilter) {
      console.log(`[GrowthFilterService] 👤 Application filtre Growth: ${specialFilters.growthFilter}`);
      filtered = filtered.filter(req => req.assigned_to === specialFilters.growthFilter);
    }
    
    // Filtre demandes non assignées
    if (specialFilters.showUnassigned) {
      console.log(`[GrowthFilterService] 👤 Application filtre non assignées`);
      filtered = filtered.filter(req => {
        const isUnassigned = !req.assigned_to || 
                            req.assigned_to === '' || 
                            req.assigned_to === null;
        return isUnassigned;
      });
    }
    
    return filtered;
  }
  
  /**
   * Filtrage simplifié et unifié avec prise en compte des filtres spéciaux
   */
  filterRequests(filterType: string, allRequests: Request[], specialFilters: SpecialFilters = {}): Request[] {
    console.log(`[GrowthFilterService] 🎯 SYSTÈME SIMPLIFIÉ - Filtrage "${filterType}" sur ${allRequests.length} demandes`);
    console.log(`[GrowthFilterService] 👤 Filtres spéciaux:`, specialFilters);
    
    // D'abord appliquer les filtres spéciaux utilisateur
    let requests = this.applySpecialFilters(allRequests, specialFilters);
    console.log(`[GrowthFilterService] 👤 Après filtres spéciaux: ${requests.length} demandes`);
    
    const activeRequests = this.getActiveRequests(requests);
    console.log(`[GrowthFilterService] 📊 Demandes actives: ${activeRequests.length}`);
    
    let filtered: Request[] = [];
    
    switch (filterType) {
      case 'all':
        filtered = activeRequests;
        break;
        
      case 'to_assign':
        filtered = activeRequests.filter(req => {
          const isUnassigned = !req.assigned_to || 
                              req.assigned_to === '' || 
                              req.assigned_to === null;
          return isUnassigned;
        });
        break;
        
      case 'my_assignments':
        filtered = activeRequests.filter(req => req.assigned_to === this.userId);
        break;
        
      case 'pending':
        filtered = activeRequests.filter(req => 
          req.status === "pending" || req.workflow_status === "pending_assignment"
        );
        break;
        
      case 'inprogress':
        filtered = activeRequests.filter(req => req.workflow_status === "in_progress");
        break;
        
      case 'completed':
        // Pour completed, on utilise TOUTES les demandes (pas juste actives)
        filtered = requests.filter(req => req.workflow_status === "completed");
        break;
        
      case 'late':
        filtered = activeRequests.filter(req => req.isLate);
        break;
        
      default:
        filtered = activeRequests;
    }
    
    console.log(`[GrowthFilterService] ✅ Résultat pour "${filterType}": ${filtered.length} demandes`);
    console.log(`[GrowthFilterService] 📋 IDs filtrés:`, filtered.map(r => r.id.substring(0, 8)));
    
    return filtered;
  }
  
  /**
   * Calculer tous les compteurs avec prise en compte des filtres spéciaux
   */
  calculateCounts(allRequests: Request[], specialFilters: SpecialFilters = {}): FilterCounts {
    // D'abord appliquer les filtres spéciaux
    const filteredRequests = this.applySpecialFilters(allRequests, specialFilters);
    const activeRequests = this.getActiveRequests(filteredRequests);
    
    const counts: FilterCounts = {
      all: activeRequests.length,
      to_assign: this.filterRequests('to_assign', allRequests, specialFilters).length,
      my_assignments: this.filterRequests('my_assignments', allRequests, specialFilters).length,
      pending: this.filterRequests('pending', allRequests, specialFilters).length,
      inprogress: this.filterRequests('inprogress', allRequests, specialFilters).length,
      completed: this.filterRequests('completed', allRequests, specialFilters).length,
      late: this.filterRequests('late', allRequests, specialFilters).length,
    };
    
    console.log("[GrowthFilterService] 📊 Compteurs finaux:", counts);
    
    return counts;
  }
}
