
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
    const { userId } = await req.json();
    if (!userId) {
      console.error("ID utilisateur manquant dans la requête");
      return new Response(
        JSON.stringify({ error: "ID utilisateur requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tentative de suppression de l'utilisateur avec l'ID: ${userId}`);

    // Supprimer directement le profil
    console.log("Suppression du profil de l'utilisateur...");
    const { error: profileDeleteError } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.warn("Avertissement lors de la suppression du profil:", profileDeleteError);
    } else {
      console.log(`Profil de l'utilisateur ${userId} supprimé avec succès`);
    }

    // Lancer la suppression de l'utilisateur en parallèle mais ne pas l'attendre
    console.log("Lancement de la suppression de l'utilisateur en arrière-plan...");
    
    // Utiliser EdgeRuntime.waitUntil pour exécuter la suppression en tâche de fond
    const deleteUserPromise = async () => {
      try {
        const { error } = await supabaseClient.auth.admin.deleteUser(userId);
        if (error) {
          console.error("Erreur en arrière-plan lors de la suppression de l'utilisateur:", error);
        } else {
          console.log(`Utilisateur ${userId} supprimé avec succès en arrière-plan`);
        }
      } catch (e) {
        console.error("Exception en arrière-plan lors de la suppression de l'utilisateur:", e);
      }
    };

    // Utiliser waitUntil pour exécuter en arrière-plan
    try {
      // @ts-ignore - Deno.env is available in Supabase Edge Functions
      EdgeRuntime.waitUntil(deleteUserPromise());
    } catch (err) {
      console.warn("Échec de la tâche en arrière-plan, suppression manuelle:", err);
      // Fallback si waitUntil n'est pas supporté
      deleteUserPromise().catch(e => console.error("Erreur dans le fallback:", e));
    }

    // Retourner une réponse rapide
    console.log(`Processus de suppression initié pour l'utilisateur ${userId}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Suppression initiée, l'utilisateur sera complètement retiré sous peu",
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
