
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
  
  // 4. Test spécifique pour vérifier les JOINs
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
  
  // 5. Vérifier s'il y a des requests avec mission_id non null
  const { data: requestsWithMissionId, error: requestsWithMissionIdError } = await supabase
    .from('requests')
    .select('id, title, mission_id')
    .not('mission_id', 'is', null)
    .limit(5);
    
  console.log("📋 REQUESTS AVEC MISSION_ID:", requestsWithMissionId);
  if (requestsWithMissionIdError) console.error("❌ ERREUR REQUESTS AVEC MISSION_ID:", requestsWithMissionIdError);
  
  // 6. Vérifier si la vue existe vraiment
  const { data: viewExists, error: viewExistsError } = await supabase
    .rpc('check_if_table_exists', { table_name: 'requests_with_missions' });
    
  console.log("📋 VUE EXISTS:", viewExists);
  if (viewExistsError) console.error("❌ ERREUR CHECK VIEW:", viewExistsError);
};
