
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
    
    // Vérifier si l'utilisateur existe
    console.log('Vérification de l\'existence de l\'utilisateur...')
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${email}`
    })
    
    if (checkError) {
      console.error('Erreur lors de la vérification:', checkError)
      throw checkError
    }
    
    const userExists = existingUsers && existingUsers.users && existingUsers.users.length > 0
    console.log(`Utilisateur existe: ${userExists ? 'OUI' : 'NON'}`)
    
    let result
    
    if (userExists) {
      console.log('Envoi d\'un lien de récupération pour utilisateur existant...')
      // Utilisateur existant - utiliser generateLink
      result = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery'
        }
      })
    } else {
      console.log('Envoi d\'une invitation pour nouvel utilisateur...')
      // Nouvel utilisateur - utiliser inviteUserByEmail
      result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=invite',
        data: {
          role: 'sdr',
          name: email.split('@')[0]
        }
      })
    }
    
    console.log('Résultat de l\'envoi d\'email:')
    console.log('- Data:', JSON.stringify(result.data, null, 2))
    console.log('- Error:', JSON.stringify(result.error, null, 2))
    
    if (result.error) {
      console.error('ERREUR lors de l\'envoi d\'email:', result.error)
      throw result.error
    }
    
    console.log('✅ Email envoyé avec succès')
    console.log('=== TEST EMAIL SIMPLE - FIN ===')
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Email envoyé avec succès pour ${userExists ? 'utilisateur existant' : 'nouvel utilisateur'}`,
      method: userExists ? 'recovery_link' : 'invitation',
      data: result.data,
      debug: {
        email_sent_to: email,
        user_existed: userExists,
        redirect_url: userExists 
          ? 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery'
          : 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=invite',
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
