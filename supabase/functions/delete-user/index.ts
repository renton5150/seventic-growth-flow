
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fonction delete-user appelée");
    
    // Créer un client Supabase avec la clé secrète pour avoir des permissions admin
    const supabaseClient = createClient(
      // @ts-ignore - Deno.env is available in Supabase Edge Functions
      Deno.env.get("SUPABASE_URL"),
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Récupérer les données de la requête
    const requestData = await req.json().catch(err => {
      console.error("Erreur lors de la lecture du corps de la requête:", err);
      return {};
    });
    
    const { userId } = requestData;
    
    if (!userId) {
      console.error("ID utilisateur manquant dans la requête");
      return new Response(
        JSON.stringify({ error: "ID utilisateur requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tentative de suppression de l'utilisateur avec l'ID: ${userId}`);

    // Fonction pour traiter les contraintes de clé étrangère
    const handleForeignKeyConstraints = async () => {
      try {
        // 1. Vérifier et mettre à jour les comptes Acelle
        console.log("1. Vérification des comptes Acelle...");
        const { data: acelleAccounts, error: acelleError } = await supabaseClient
          .from("acelle_accounts")
          .select("id")
          .eq("mission_id", userId);
        
        if (acelleError) {
          console.warn("Erreur lors de la vérification des comptes Acelle:", acelleError);
        } else if (acelleAccounts && acelleAccounts.length > 0) {
          console.log(`${acelleAccounts.length} comptes Acelle trouvés liés à l'utilisateur ${userId}`);
          
          // Mettre à NULL la référence mission_id
          const { error: updateAcelleError } = await supabaseClient
            .from("acelle_accounts")
            .update({ mission_id: null })
            .in("id", acelleAccounts.map(acc => acc.id));
          
          if (updateAcelleError) {
            console.error("Erreur lors de la mise à jour des comptes Acelle:", updateAcelleError);
            throw updateAcelleError;
          } else {
            console.log("✓ Références mission_id supprimées des comptes Acelle");
          }
        } else {
          console.log("Aucun compte Acelle lié à cet utilisateur");
        }
        
        // 2. Vérifier et mettre à jour les missions
        console.log("2. Vérification des missions liées...");
        const { data: userMissions, error: missionsError } = await supabaseClient
          .from("missions")
          .select("id")
          .or(`sdr_id.eq.${userId},growth_id.eq.${userId}`);
        
        if (missionsError) {
          console.warn("Erreur lors de la vérification des missions:", missionsError);
        } else if (userMissions && userMissions.length > 0) {
          console.log(`${userMissions.length} missions liées à l'utilisateur ${userId}`);
          
          // Mettre à NULL les références à l'utilisateur dans les missions (sdr_id et growth_id)
          for (const mission of userMissions) {
            // Vérifier si l'utilisateur est sdr_id
            const { data: missionSdr } = await supabaseClient
              .from("missions")
              .select("sdr_id")
              .eq("id", mission.id)
              .single();
            
            // Vérifier si l'utilisateur est growth_id
            const { data: missionGrowth } = await supabaseClient
              .from("missions")
              .select("growth_id")
              .eq("id", mission.id)
              .single();
            
            // Mettre à jour les champs appropriés
            const updates: { sdr_id?: null; growth_id?: null } = {};
            if (missionSdr && missionSdr.sdr_id === userId) {
              updates.sdr_id = null;
            }
            if (missionGrowth && missionGrowth.growth_id === userId) {
              updates.growth_id = null;
            }
            
            // Appliquer les mises à jour
            if (Object.keys(updates).length > 0) {
              const { error: updateMissionError } = await supabaseClient
                .from("missions")
                .update(updates)
                .eq("id", mission.id);
              
              if (updateMissionError) {
                console.error(`Erreur lors de la mise à jour de la mission ${mission.id}:`, updateMissionError);
              } else {
                console.log(`✓ Références utilisateur supprimées de la mission ${mission.id}`);
              }
            }
          }
        } else {
          console.log("Aucune mission liée à cet utilisateur");
        }
        
        // 3. Vérifier et mettre à jour les requêtes
        console.log("3. Vérification des requêtes liées...");
        const { data: userRequests, error: requestsError } = await supabaseClient
          .from("requests")
          .select("id")
          .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
        
        if (requestsError) {
          console.warn("Erreur lors de la vérification des requêtes:", requestsError);
        } else if (userRequests && userRequests.length > 0) {
          console.log(`${userRequests.length} requêtes liées à l'utilisateur ${userId}`);
          
          // Mettre à NULL les références à l'utilisateur
          const { error: updateRequestsError } = await supabaseClient
            .from("requests")
            .update({
              created_by: null,
              assigned_to: null,
              workflow_status: 'canceled'
            })
            .in("id", userRequests.map(req => req.id));
          
          if (updateRequestsError) {
            console.error("Erreur lors de la mise à jour des requêtes:", updateRequestsError);
          } else {
            console.log("✓ Références utilisateur supprimées des requêtes");
          }
        } else {
          console.log("Aucune requête liée à cet utilisateur");
        }
        
        return true;
      } catch (error) {
        console.error("Erreur lors du traitement des contraintes de clé étrangère:", error);
        throw error;
      }
    };

    // Traiter les contraintes de clé étrangère avant de supprimer l'utilisateur
    console.log("Préparation de la suppression - traitement des contraintes de clé étrangère...");
    await handleForeignKeyConstraints();
    
    // 4. Suppression du profil utilisateur
    console.log("4. Suppression du profil utilisateur...");
    const { error: profileDeleteError } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId);
    
    if (profileDeleteError) {
      console.warn("Avertissement lors de la suppression du profil:", profileDeleteError);
    } else {
      console.log(`✓ Profil utilisateur ${userId} supprimé avec succès`);
    }
    
    // 5. Suppression de l'utilisateur de auth.users
    console.log("5. Suppression de l'utilisateur de auth.users...");
    const { error: userDeleteError } = await supabaseClient.auth.admin.deleteUser(userId);
    
    if (userDeleteError) {
      console.error("Erreur lors de la suppression de l'utilisateur:", userDeleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: userDeleteError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`✓ Utilisateur ${userId} supprimé avec succès`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Utilisateur supprimé avec succès"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de l'utilisateur:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
