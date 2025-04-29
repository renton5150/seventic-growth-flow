
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

    try {
      // 0. Vérifier les contraintes de clé étrangère dans acelle_accounts
      console.log("0. Vérification des contraintes avec acelle_accounts...");
      const { data: acelleAccounts, error: acelleError } = await supabaseClient
        .from("acelle_accounts")
        .select("id, mission_id")
        .eq("mission_id", userId);
      
      if (acelleError) {
        console.warn("Erreur lors de la vérification des comptes Acelle:", acelleError);
      } else if (acelleAccounts && acelleAccounts.length > 0) {
        console.log(`${acelleAccounts.length} comptes Acelle trouvés avec l'utilisateur ${userId}`);
        
        // Mettre à null la référence mission_id dans acelle_accounts
        const { error: updateError } = await supabaseClient
          .from("acelle_accounts")
          .update({ mission_id: null })
          .in("id", acelleAccounts.map(account => account.id));
        
        if (updateError) {
          console.error("Erreur lors de la mise à jour des comptes Acelle:", updateError);
          // Continuer malgré l'erreur
        } else {
          console.log("Références aux missions supprimées des comptes Acelle");
        }
      }
      
      // 1. Vérifier et nettoyer les missions liées
      console.log("1. Vérification des missions liées...");
      const { data: relatedMissions, error: missionsError } = await supabaseClient
        .from("missions")
        .select("id")
        .or(`sdr_id.eq.${userId},growth_id.eq.${userId}`);
        
      if (missionsError) {
        console.warn("Erreur lors de la vérification des missions liées:", missionsError);
      } else if (relatedMissions && relatedMissions.length > 0) {
        console.log(`${relatedMissions.length} missions liées trouvées`);
        
        // Mettre à null les références aux utilisateurs dans ces missions
        const { error: updateError } = await supabaseClient
          .from("missions")
          .update({ 
            sdr_id: supabaseClient.rpc('CASE WHEN sdr_id = $1 THEN null ELSE sdr_id END', [userId]),
            growth_id: supabaseClient.rpc('CASE WHEN growth_id = $1 THEN null ELSE growth_id END', [userId])
          })
          .in("id", relatedMissions.map(mission => mission.id));
          
        if (updateError) {
          console.error("Erreur lors de la mise à jour des missions:", updateError);
          // Continuer malgré l'erreur
        } else {
          console.log("Références aux utilisateurs supprimées des missions");
        }
      }

      // 2. Nettoyer les requêtes créées par l'utilisateur
      console.log("2. Nettoyage des requêtes créées par l'utilisateur...");
      const { data: userRequests, error: requestsError } = await supabaseClient
        .from("requests")
        .select("id")
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
      
      if (requestsError) {
        console.warn("Erreur lors de la vérification des requêtes liées:", requestsError);
      } else if (userRequests && userRequests.length > 0) {
        console.log(`${userRequests.length} requêtes liées trouvées`);
        
        // Mettre à null les références aux utilisateurs dans ces requêtes
        const { error: updateError } = await supabaseClient
          .from("requests")
          .update({ 
            created_by: null,
            assigned_to: null 
          })
          .in("id", userRequests.map(request => request.id));
          
        if (updateError) {
          console.error("Erreur lors de la mise à jour des requêtes:", updateError);
          // Continuer malgré l'erreur
        } else {
          console.log("Références aux utilisateurs supprimées des requêtes");
        }
      }

      // 3. Supprimer le profil de l'utilisateur
      console.log("3. Suppression du profil de l'utilisateur...");
      const { error: profileDeleteError } = await supabaseClient
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileDeleteError) {
        console.warn("Avertissement lors de la suppression du profil:", profileDeleteError);
        // Continuer avec la suppression de l'utilisateur même si la suppression du profil échoue
      } else {
        console.log(`Profil de l'utilisateur ${userId} supprimé avec succès`);
      }
      
      // 4. Supprimer l'utilisateur de auth.users
      console.log("4. Suppression de l'utilisateur de auth.users...");
      const { error: userDeleteError } = await supabaseClient.auth.admin.deleteUser(userId);
      
      if (userDeleteError) {
        console.error("Erreur lors de la suppression de l'utilisateur:", userDeleteError);
        
        // Si le profil a été supprimé mais pas l'utilisateur, renvoyer un avertissement
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: userDeleteError.message 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Si nous arrivons ici, tout s'est bien passé
      console.log(`Utilisateur ${userId} supprimé avec succès`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Utilisateur supprimé avec succès"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (innerError) {
      console.error("Erreur interne lors de la suppression:", innerError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: innerError instanceof Error ? innerError.message : String(innerError)
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
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
