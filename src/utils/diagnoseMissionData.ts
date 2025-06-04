
import { supabase } from "@/integrations/supabase/client";

export const diagnoseMissionData = async () => {
  console.log("🔍 DIAGNOSTIC COMPLET - Analyse des données de missions");
  
  // 1. Vérifier les données dans la table requests
  const { data: requests, error: requestsError } = await supabase
    .from('requests')
    .select('id, title, mission_id')
    .limit(5);
    
  console.log("📋 REQUESTS:", requests);
  if (requestsError) console.error("❌ ERREUR REQUESTS:", requestsError);
  
  // 2. Vérifier les données dans la table missions
  const { data: missions, error: missionsError } = await supabase
    .from('missions')
    .select('id, name, client')
    .limit(5);
    
  console.log("📋 MISSIONS:", missions);
  if (missionsError) console.error("❌ ERREUR MISSIONS:", missionsError);
  
  // 3. Vérifier les données dans la vue requests_with_missions
  const { data: requestsWithMissions, error: viewError } = await supabase
    .from('requests_with_missions')
    .select('id, title, mission_id, mission_name, mission_client')
    .limit(5);
    
  console.log("📋 REQUESTS_WITH_MISSIONS VIEW:", requestsWithMissions);
  if (viewError) console.error("❌ ERREUR VIEW:", viewError);
  
  // 4. Test d'un JOIN manuel pour voir si ça marche
  const { data: manualJoin, error: joinError } = await supabase
    .from('requests')
    .select(`
      id,
      title,
      mission_id,
      missions:mission_id (
        name,
        client
      )
    `)
    .limit(5);
    
  console.log("📋 JOIN MANUEL:", manualJoin);
  if (joinError) console.error("❌ ERREUR JOIN:", joinError);
};
