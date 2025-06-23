
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
    const { email, userName, userRole } = await req.json()
    
    console.log('=== SIMPLE EMAIL INVITE - DÉBUT ===')
    console.log('Email:', email)
    console.log('Nom:', userName)
    console.log('Rôle:', userRole)
    console.log('Timestamp:', new Date().toISOString())
    
    // Créer client Supabase avec clé admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )
    
    // Vérifier si l'utilisateur existe déjà
    console.log('Vérification existence utilisateur...')
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${email}`
    })
    
    if (checkError) {
      console.error('Erreur vérification utilisateur:', checkError)
      throw checkError
    }
    
    const userExists = existingUsers && existingUsers.users && existingUsers.users.length > 0
    console.log(`Utilisateur existe: ${userExists ? 'OUI' : 'NON'}`)
    
    let result
    let method
    
    if (userExists) {
      console.log('Envoi lien de réinitialisation (utilisateur existant)...')
      method = 'reset_link'
      
      result = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery'
        }
      })
    } else {
      console.log('Envoi invitation (nouvel utilisateur)...')
      method = 'invitation'
      
      result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=invite',
        data: {
          role: userRole || 'sdr',
          name: userName || email.split('@')[0]
        }
      })
    }
    
    console.log('Résultat envoi email:', JSON.stringify(result, null, 2))
    
    if (result.error) {
      console.error('ERREUR envoi email:', result.error)
      throw result.error
    }
    
    console.log('✅ Email envoyé avec succès via Supabase')
    console.log('=== SIMPLE EMAIL INVITE - FIN ===')
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Email envoyé avec succès (${method})`,
      userExists: userExists,
      method: method,
      data: result.data,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('❌ ERREUR dans simple-email-invite:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
