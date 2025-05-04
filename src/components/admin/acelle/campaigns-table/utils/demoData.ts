
import { AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle";

/**
 * Génère des campagnes factices pour le mode démo
 */
export function generateDemoCampaigns(page: number = 1, perPage: number = 5): AcelleCampaign[] {
  const statuses = ["sent", "sending", "queued", "ready", "new", "paused", "failed"];
  const subjectPrefixes = ["Newsletter", "Promotion", "Annonce", "Invitation", "Bienvenue"];
  
  // Décaler l'index de départ en fonction de la page
  const startIndex = (page - 1) * perPage;
  
  return Array.from({ length: perPage }).map((_, index) => {
    const now = new Date();
    const globalIndex = startIndex + index;
    const randomDays = Math.floor(Math.random() * 30);
    const createdDate = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const subject = `${subjectPrefixes[Math.floor(Math.random() * subjectPrefixes.length)]} ${globalIndex + 1}`;
    
    // Créer une campagne simulée avec statistiques
    const simulatedStats = acelleService.generateMockCampaigns(1)[0];
    
    return {
      uid: `demo-${globalIndex}`,
      campaign_uid: `demo-${globalIndex}`,
      name: `Campagne démo ${globalIndex + 1}`,
      subject: subject,
      status: status,
      created_at: createdDate.toISOString(),
      updated_at: new Date().toISOString(),
      delivery_date: status === "new" ? null : new Date().toISOString(),
      run_at: null,
      delivery_info: simulatedStats.delivery_info,
      statistics: simulatedStats.statistics
    } as AcelleCampaign;
  });
}
