
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    
    console.log('=== TEST EMAIL SIMPLE - DÉBUT ===')
    console.log('Email cible:', email)
    console.log('Timestamp:', new Date().toISOString())
    
    // Créer client Supabase avec clé admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )
    
    console.log('Variables d\'environnement:')
    console.log('- SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? 'Définie' : 'MANQUANTE')
    console.log('- SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Définie' : 'MANQUANTE')
    
    console.log('Tentative d\'envoi d\'email via generateLink...')
    
    // Utiliser directement generateLink pour tester l'envoi d'email
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery'
      }
    })
    
    console.log('Résultat generateLink:')
    console.log('- Data:', JSON.stringify(data, null, 2))
    console.log('- Error:', JSON.stringify(error, null, 2))
    
    if (error) {
      console.error('ERREUR lors de generateLink:', error)
      throw error
    }
    
    console.log('✅ Email envoyé avec succès')
    console.log('=== TEST EMAIL SIMPLE - FIN ===')
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email envoyé avec succès via generateLink',
      data: data,
      debug: {
        email_sent_to: email,
        redirect_url: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery',
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('❌ ERREUR dans test-email-simple:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message,
      error_details: error
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
