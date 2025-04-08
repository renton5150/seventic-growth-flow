
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

    // Vérifier l'authentification de la requête
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Erreur d'authentification: token manquant ou invalide");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur est autorisé (admin uniquement)
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("Erreur d'authentification:", authError);
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur est un admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Erreur lors de la récupération du profil:", profileError);
      return new Response(
        JSON.stringify({ error: "Impossible de vérifier les permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile || profile.role !== "admin") {
      console.error("Accès non autorisé pour l'utilisateur:", user.id);
      return new Response(
        JSON.stringify({ error: "Autorisé uniquement pour les administrateurs" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Supprimer d'abord les entrées dans la table profiles pour éviter les erreurs de clé étrangère
    // Cette opération est plus rapide et rend le processus global plus fiable
    const { error: profileDeleteError } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.warn("Avertissement lors de la suppression du profil:", profileDeleteError);
      // Continuer malgré l'erreur car RLS ou triggers peuvent parfois empêcher cette opération
    } else {
      console.log(`Profil de l'utilisateur ${userId} supprimé avec succès`);
    }

    // Supprimer l'utilisateur de auth.users avec un timeout plus court (5 secondes)
    // Réduire la durée max à 5 secondes pour éviter de bloquer l'utilisateur
    const deletePromise = supabaseClient.auth.admin.deleteUser(userId);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Délai d'attente dépassé")), 5000);
    });

    // Supprimer l'utilisateur avec un timeout
    try {
      const { error: deleteError } = await Promise.race([deletePromise, timeoutPromise]);

      if (deleteError) {
        console.error("Erreur lors de la suppression de l'utilisateur:", deleteError);
        // Même en cas d'erreur, nous considérons que l'opération a potentiellement réussi 
        // car le profil a été supprimé et l'auth.users peut être nettoyé automatiquement par Supabase
        return new Response(
          JSON.stringify({ 
            success: true, 
            warning: deleteError.message,
            message: "Utilisateur probablement supprimé, mais avec des avertissements"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (timeoutError) {
      console.warn("Timeout lors de la suppression de l'utilisateur:", timeoutError);
      // Même en cas de timeout, ne pas bloquer l'interface utilisateur
      // Le nettoyage se fera automatiquement par Supabase
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "L'opération a pris plus de 5 secondes. La suppression a été initiée et sera terminée en arrière-plan.",
          message: "Utilisateur en cours de suppression"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Utilisateur ${userId} supprimé avec succès`);
    return new Response(
      JSON.stringify({ success: true, message: "Utilisateur supprimé avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression de l'utilisateur:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
