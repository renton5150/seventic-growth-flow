
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

    // Récupérer TOUTES les données nécessaires - VERSION COMPLÈTE
    let dataContext = "";
    
    // 1. Récupérer les utilisateurs et leurs profils complets
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name, email, role, avatar, created_at')
      .in('role', ['sdr', 'growth', 'admin']);

    // 2. Récupérer TOUTES les demandes avec détails complets
    const { data: requests } = await supabase
      .from('requests_with_missions')
      .select(`
        id, title, type, status, workflow_status, 
        created_by, assigned_to, due_date, created_at, updated_at,
        mission_id, mission_name, mission_client, sdr_name, assigned_to_name,
        target_role, details
      `);

    // 3. Récupérer TOUTES les missions avec leurs détails complets
    const { data: missions } = await supabase
      .from('missions')
      .select(`
        id, name, client, type, status, sdr_id, growth_id,
        start_date, end_date, created_at, updated_at, description,
        sdr:profiles!missions_sdr_id_fkey(name, email),
        growth:profiles!missions_growth_id_fkey(name, email)
      `);

    // 4. Récupérer les statistiques CRA
    const { data: craReports } = await supabase
      .from('cra_reports_with_details')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(50);

    // 5. Récupérer les statistiques des campagnes email (si disponibles)
    const { data: emailCampaigns } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .limit(20);

    // 6. Calculer les statistiques par utilisateur - LOGIQUE COMPLÈTE
    const userStats = users?.map(user => {
      if (user.role === 'sdr') {
        const userRequests = requests?.filter(req => req.created_by === user.id) || [];
        const userMissions = missions?.filter(mission => mission.sdr_id === user.id) || [];
        const fullMissions = userMissions.filter(mission => mission.type === 'Full');
        const activeMissions = userMissions.filter(mission => mission.status === 'En cours');
        const userCraReports = craReports?.filter(cra => cra.sdr_id === user.id) || [];
        
        return {
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          joinDate: user.created_at,
          requests: {
            total: userRequests.length,
            pending: userRequests.filter(req => req.workflow_status === 'pending_assignment' || req.workflow_status === 'in_progress').length,
            completed: userRequests.filter(req => req.workflow_status === 'completed').length,
            late: userRequests.filter(req => 
              req.workflow_status !== 'completed' && 
              req.workflow_status !== 'canceled' &&
              req.due_date && 
              new Date(req.due_date) < new Date()
            ).length,
            byType: {
              email: userRequests.filter(req => req.type === 'email').length,
              database: userRequests.filter(req => req.type === 'database').length,
              linkedin: userRequests.filter(req => req.type === 'linkedin').length
            }
          },
          missions: {
            total: userMissions.length,
            full: fullMissions.length,
            active: activeMissions.length,
            clients: [...new Set(userMissions.map(m => m.client))],
            clientsCount: [...new Set(userMissions.map(m => m.client))].length,
            details: userMissions.map(m => ({
              name: m.name,
              client: m.client,
              type: m.type,
              status: m.status,
              startDate: m.start_date,
              endDate: m.end_date
            }))
          },
          cra: {
            totalReports: userCraReports.length,
            completedReports: userCraReports.filter(cra => cra.is_completed).length,
            averagePercentage: userCraReports.length > 0 
              ? Math.round(userCraReports.reduce((sum, cra) => sum + (cra.total_percentage || 0), 0) / userCraReports.length)
              : 0
          }
        };
      } else if (user.role === 'growth' || user.role === 'admin') {
        const userRequests = requests?.filter(req => req.assigned_to === user.id) || [];
        const unassignedRequests = requests?.filter(req => !req.assigned_to && req.workflow_status !== 'completed' && req.workflow_status !== 'canceled') || [];
        const userMissions = missions?.filter(mission => mission.growth_id === user.id) || [];
        
        return {
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          joinDate: user.created_at,
          requests: {
            total: userRequests.length,
            pending: userRequests.filter(req => req.workflow_status === 'pending_assignment' || req.workflow_status === 'in_progress').length,
            completed: userRequests.filter(req => req.workflow_status === 'completed').length,
            late: userRequests.filter(req => 
              req.workflow_status !== 'completed' && 
              req.workflow_status !== 'canceled' &&
              req.due_date && 
              new Date(req.due_date) < new Date()
            ).length,
            unassigned: user.role === 'growth' ? unassignedRequests.length : 0,
            byType: {
              email: userRequests.filter(req => req.type === 'email').length,
              database: userRequests.filter(req => req.type === 'database').length,
              linkedin: userRequests.filter(req => req.type === 'linkedin').length
            }
          },
          missions: {
            total: userMissions.length,
            managed: userMissions.length,
            details: userMissions.map(m => ({
              name: m.name,
              client: m.client,
              type: m.type,
              status: m.status,
              sdrName: m.sdr?.name
            }))
          }
        };
      }
      return null;
    }).filter(Boolean);

    // 7. Statistiques globales des missions - COMPLÈTES
    const missionStats = {
      total: missions?.length || 0,
      active: missions?.filter(m => m.status === 'En cours').length || 0,
      completed: missions?.filter(m => m.status === 'Fin').length || 0,
      fullMissions: missions?.filter(m => m.type === 'Full').length || 0,
      clients: [...new Set(missions?.map(m => m.client) || [])],
      clientsCount: [...new Set(missions?.map(m => m.client) || [])].length,
      byClient: missions?.reduce((acc, mission) => {
        acc[mission.client] = (acc[mission.client] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    // 8. Statistiques globales des demandes - COMPLÈTES
    const requestStats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.workflow_status === 'pending_assignment' || r.workflow_status === 'in_progress').length || 0,
      completed: requests?.filter(r => r.workflow_status === 'completed').length || 0,
      late: requests?.filter(r => 
        r.workflow_status !== 'completed' && 
        r.workflow_status !== 'canceled' &&
        r.due_date && 
        new Date(r.due_date) < new Date()
      ).length || 0,
      unassigned: requests?.filter(r => !r.assigned_to && r.workflow_status !== 'completed' && r.workflow_status !== 'canceled').length || 0,
      byType: {
        email: requests?.filter(r => r.type === 'email').length || 0,
        database: requests?.filter(r => r.type === 'database').length || 0,
        linkedin: requests?.filter(r => r.type === 'linkedin').length || 0
      },
      byStatus: requests?.reduce((acc, req) => {
        acc[req.workflow_status] = (acc[req.workflow_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    // Construire le contexte de données ULTRA COMPLET
    dataContext = `
Données COMPLÈTES de l'application Seventic - Système de gestion des demandes Growth et des MISSIONS :

=== UTILISATEURS ET STATISTIQUES DÉTAILLÉES ===
${userStats?.map(stat => `
👤 ${stat.name} (${stat.role.toUpperCase()}) - ${stat.email}
   Membre depuis: ${stat.joinDate ? new Date(stat.joinDate).toLocaleDateString('fr-FR') : 'N/A'}
   
   📋 DEMANDES:
   • Total: ${stat.requests.total}
   • En attente: ${stat.requests.pending}
   • Terminées: ${stat.requests.completed}
   • En retard: ${stat.requests.late}
   ${stat.requests.unassigned !== undefined ? `• Non assignées (visible par Growth): ${stat.requests.unassigned}` : ''}
   • Par type: Email(${stat.requests.byType.email}), Database(${stat.requests.byType.database}), LinkedIn(${stat.requests.byType.linkedin})
   
   🎯 MISSIONS:
   • Total missions: ${stat.missions.total}
   ${stat.missions.full !== undefined ? `• Missions Full: ${stat.missions.full}` : ''}
   ${stat.missions.active !== undefined ? `• Missions actives: ${stat.missions.active}` : ''}
   ${stat.missions.managed !== undefined ? `• Missions gérées: ${stat.missions.managed}` : ''}
   ${stat.missions.clientsCount !== undefined ? `• Clients différents: ${stat.missions.clientsCount}` : ''}
   ${stat.missions.clients ? `• Clients: ${stat.missions.clients.join(', ')}` : ''}
   
   ${stat.cra ? `📊 CRA (Comptes Rendus d'Activité):
   • Rapports total: ${stat.cra.totalReports}
   • Rapports complétés: ${stat.cra.completedReports}
   • Pourcentage moyen: ${stat.cra.averagePercentage}%` : ''}
`).join('')}

=== MISSIONS DÉTAILLÉES ===
Total: ${missionStats.total} | Actives: ${missionStats.active} | Terminées: ${missionStats.completed} | Missions Full: ${missionStats.fullMissions}
Clients uniques: ${missionStats.clientsCount} - ${missionStats.clients.join(', ')}

Répartition par client:
${Object.entries(missionStats.byClient).map(([client, count]) => `• ${client}: ${count} mission(s)`).join('\n')}

Dernières missions:
${missions?.slice(0, 10).map(mission => `
• "${mission.name}" - ${mission.client}
  Type: ${mission.type} | Statut: ${mission.status}
  SDR: ${mission.sdr?.name || 'Non assigné'} | Growth: ${mission.growth?.name || 'Non assigné'}
  Période: ${mission.start_date || 'N/A'} → ${mission.end_date || 'N/A'}
`).join('')}

=== DEMANDES DÉTAILLÉES ===
Total: ${requestStats.total} | En attente: ${requestStats.pending} | Terminées: ${requestStats.completed} | En retard: ${requestStats.late} | Non assignées: ${requestStats.unassigned}

Par type:
• Email: ${requestStats.byType.email}
• Database: ${requestStats.byType.database}  
• LinkedIn: ${requestStats.byType.linkedin}

Par statut:
${Object.entries(requestStats.byStatus).map(([status, count]) => `• ${status}: ${count}`).join('\n')}

Dernières demandes:
${requests?.slice(0, 15).map(req => `
• "${req.title}" (${req.type})
  Statut: ${req.workflow_status} | Mission: ${req.mission_name || 'Sans mission'}
  Créée par: ${req.sdr_name || 'Inconnu'} | Assignée à: ${req.assigned_to_name || 'Non assigné'}
  Échéance: ${req.due_date ? new Date(req.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
  Client: ${req.mission_client || 'N/A'}
`).join('')}

=== STATISTIQUES GLOBALES ===
👥 Utilisateurs: ${users?.length || 0} (SDR: ${users?.filter(u => u.role === 'sdr').length || 0}, Growth: ${users?.filter(u => u.role === 'growth').length || 0}, Admin: ${users?.filter(u => u.role === 'admin').length || 0})
🎯 Missions: ${missionStats.total} (${missionStats.active} actives, ${missionStats.fullMissions} Full)
📋 Demandes: ${requestStats.total} (${requestStats.pending} en attente, ${requestStats.unassigned} non assignées)
🏢 Clients: ${missionStats.clientsCount} clients uniques

${emailCampaigns?.length ? `=== CAMPAGNES EMAIL ===
Total campagnes: ${emailCampaigns.length}
Dernières campagnes:
${emailCampaigns.slice(0, 5).map(camp => `• ${camp.name} - ${camp.subject} (${camp.status})`).join('\n')}` : ''}

${craReports?.length ? `=== RAPPORTS CRA RÉCENTS ===
${craReports.slice(0, 10).map(cra => `• ${cra.sdr_name} - ${cra.report_date} (${cra.total_percentage}% - ${cra.is_completed ? 'Complété' : 'En cours'})`).join('\n')}` : ''}

IMPORTANT : 
• MISSIONS = Projets clients assignés aux SDR/Growth (ex: "Mission Klee", "Mission Freshworks")
• DEMANDES = Tâches spécifiques dans le cadre des missions (campagnes email, création de bases, scraping LinkedIn)
• SDR = créent des demandes, Growth = traitent les demandes assignées
• "En attente" pour SDR = demandes qu'ils ont créées en pending_assignment/in_progress
• "En attente" pour Growth = demandes qui leur sont assignées en pending_assignment/in_progress
`;

    console.log("[AI Chat] Sending COMPLETE context to Claude");

    // Appeler Claude avec le contexte ULTRA COMPLET
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": anthropicKey
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        system: `Tu es Claude, un assistant IA intégré dans Seventic, une application de gestion de demandes Growth/SDR et de missions client. 
        
Tu as accès aux données COMPLÈTES et en temps réel de l'application. Réponds de manière conversationnelle et naturelle aux questions sur :
- Les performances des utilisateurs (SDR et Growth) avec détails précis
- Les statistiques des demandes ET des missions avec nuances
- Les tendances et analyses approfondies
- Les recommandations d'amélioration personnalisées
- Les rapports CRA et suivis d'activité
- Les campagnes email et leur performance

CRUCIAL : Fais ABSOLUMENT la distinction entre :
- MISSIONS : Projets clients assignés aux SDR/Growth (ex: "Mission Klee", "Mission Freshworks") - utilise les données missions
- DEMANDES : Tâches spécifiques dans le cadre des missions (campagnes email, création de bases, scraping LinkedIn) - utilise les données requests

Pour les questions sur "qui gère le plus de missions Full", utilise les données missions.missions.full ou missions.details.
Pour les questions sur les demandes, utilise les données requests.

Utilise les données fournies pour donner des réponses précises, détaillées et utiles. Sois concis mais informatif, et toujours factuel.`,
        messages: [
          { 
            role: "user", 
            content: `Contexte des données COMPLÈTES de l'application :\n${dataContext}\n\nQuestion de l'utilisateur : ${question}` 
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
