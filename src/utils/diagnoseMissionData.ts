
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
  
  // 3. Test spécifique d'un JOIN simple
  const { data: joinTest, error: joinTestError } = await supabase
    .from('requests')
    .select(`
      id,
      title,
      mission_id,
      missions (
        name,
        client
      )
    `)
    .limit(3);
    
  console.log("📋 JOIN TEST SIMPLE:", joinTest);
  if (joinTestError) console.error("❌ ERREUR JOIN TEST:", joinTestError);
  
  // 4. Vérifier s'il y a des requests avec mission_id non null
  const { data: requestsWithMissionId, error: requestsWithMissionIdError } = await supabase
    .from('requests')
    .select('id, title, mission_id')
    .not('mission_id', 'is', null)
    .limit(5);
    
  console.log("📋 REQUESTS AVEC MISSION_ID:", requestsWithMissionId);
  if (requestsWithMissionIdError) console.error("❌ ERREUR REQUESTS AVEC MISSION_ID:", requestsWithMissionIdError);
  
  // 5. Test manuel de correspondance
  if (requests && missions && requests.length > 0 && missions.length > 0) {
    const testRequest = requests[0];
    if (testRequest.mission_id) {
      const matchingMission = missions.find(m => m.id === testRequest.mission_id);
      console.log(`🔍 CORRESPONDANCE MANUELLE - Request ${testRequest.id} (mission_id: ${testRequest.mission_id}):`, matchingMission);
    }
  }
};
