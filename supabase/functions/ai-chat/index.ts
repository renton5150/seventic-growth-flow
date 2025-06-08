
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, context } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!anthropicKey) {
      throw new Error("Anthropic API key not configured");
    }

    // Récupérer les données nécessaires selon le contexte
    let dataContext = "";
    
    // Récupérer les utilisateurs et leurs statistiques
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .in('role', ['sdr', 'growth', 'admin']);

    // Récupérer les demandes
    const { data: requests } = await supabase
      .from('requests_with_missions')
      .select(`
        id, title, type, status, workflow_status, 
        created_by, assigned_to, due_date, created_at,
        created_by_profile:profiles!created_by(name),
        assigned_to_profile:profiles!assigned_to(name)
      `);

    // Calculer les statistiques par utilisateur
    const userStats = users?.map(user => {
      if (user.role === 'sdr') {
        const userRequests = requests?.filter(req => req.created_by === user.id) || [];
        return {
          name: user.name,
          role: user.role,
          total: userRequests.length,
          pending: userRequests.filter(req => req.workflow_status === 'pending_assignment' || req.workflow_status === 'in_progress').length,
          completed: userRequests.filter(req => req.workflow_status === 'completed').length,
          late: userRequests.filter(req => req.workflow_status !== 'completed' && req.due_date && new Date(req.due_date) < new Date()).length
        };
      } else if (user.role === 'growth' || user.role === 'admin') {
        const userRequests = requests?.filter(req => req.assigned_to === user.id) || [];
        const unassignedRequests = requests?.filter(req => !req.assigned_to) || [];
        return {
          name: user.name,
          role: user.role,
          total: userRequests.length,
          pending: userRequests.filter(req => req.workflow_status === 'pending_assignment' || req.workflow_status === 'in_progress').length,
          completed: userRequests.filter(req => req.workflow_status === 'completed').length,
          late: userRequests.filter(req => req.workflow_status !== 'completed' && req.due_date && new Date(req.due_date) < new Date()).length,
          unassigned: user.role === 'growth' ? unassignedRequests.length : 0
        };
      }
      return null;
    }).filter(Boolean);

    // Construire le contexte de données
    dataContext = `
Données de l'application Seventic - Système de gestion des demandes Growth :

UTILISATEURS ET STATISTIQUES :
${userStats?.map(stat => `
- ${stat.name} (${stat.role.toUpperCase()}) :
  * Total: ${stat.total} demandes
  * En attente: ${stat.pending}
  * Terminées: ${stat.completed}
  * En retard: ${stat.late}
  ${stat.unassigned !== undefined ? `* Non assignées (pour Growth): ${stat.unassigned}` : ''}
`).join('')}

DEMANDES RÉCENTES :
${requests?.slice(0, 10).map(req => `
- "${req.title}" (${req.type})
  * Statut: ${req.workflow_status}
  * Créée par: ${req.created_by_profile?.name || 'Inconnu'}
  * Assignée à: ${req.assigned_to_profile?.name || 'Non assigné'}
  * Date limite: ${req.due_date || 'Non définie'}
`).join('')}

STATISTIQUES GLOBALES :
- Total utilisateurs: ${users?.length || 0}
- Total demandes: ${requests?.length || 0}
- SDR: ${users?.filter(u => u.role === 'sdr').length || 0}
- Growth: ${users?.filter(u => u.role === 'growth').length || 0}
`;

    console.log("[AI Chat] Sending request to Claude with context");

    // Appeler Claude avec le contexte
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": anthropicKey
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system: `Tu es Claude, un assistant IA intégré dans Seventic, une application de gestion de demandes Growth/SDR. 
        
Tu as accès aux données en temps réel de l'application. Réponds de manière conversationnelle et naturelle aux questions sur :
- Les performances des utilisateurs (SDR et Growth)
- Les statistiques des demandes
- Les tendances et analyses
- Les recommandations d'amélioration

Utilise les données fournies pour donner des réponses précises et utiles. Sois concis mais informatif.`,
        messages: [
          { 
            role: "user", 
            content: `Contexte des données actuelles de l'application :\n${dataContext}\n\nQuestion de l'utilisateur : ${question}` 
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API call failed with status ${response.status}`);
    }

    const anthropicResponse = await response.json();
    const aiResponse = anthropicResponse.content?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response text from Claude");
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Une erreur s'est produite",
        response: "Désolé, je ne peux pas répondre à votre question pour le moment. Veuillez réessayer plus tard."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  }
});
