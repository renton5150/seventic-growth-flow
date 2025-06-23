
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
    const body = await req.json()
    const { action, ...params } = body
    
    console.log('=== USER INVITATION SYSTEM ===')
    console.log('Action:', action)
    console.log('Params:', params)
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    switch (action) {
      case 'create_invitation': {
        const { email, name, role, created_by, force_create = false } = params
        
        if (!email || !name || !role || !created_by) {
          return new Response(JSON.stringify({
            success: false,
            error: 'missing_parameters',
            message: 'Paramètres manquants'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
        
        console.log('🔍 Vérification invitation existante pour:', email)
        
        // Vérifier s'il existe déjà une invitation active pour cet email
        const { data: existingInvitation, error: invitationError } = await supabaseAdmin
          .from('user_invitations')
          .select('*')
          .eq('email', email)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()
        
        if (invitationError) {
          console.error('❌ Erreur vérification invitation:', invitationError)
        }
        
        if (existingInvitation && !force_create) {
          console.log('⚠️ Invitation active trouvée')
          return new Response(JSON.stringify({
            success: false,
            error: 'active_invitation_exists',
            invitation: existingInvitation,
            message: 'Une invitation active existe déjà pour cet email'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
        
        console.log('🔍 Vérification utilisateur existant pour:', email)
        
        // Vérifier si l'utilisateur existe déjà
        let userExists = false
        try {
          const { data: existingUser, error: userError } = await supabaseAdmin.auth.admin.listUsers()
          
          if (userError) {
            console.error('❌ Erreur vérification utilisateur:', userError)
          } else if (existingUser && existingUser.users) {
            userExists = existingUser.users.some(user => user.email === email)
          }
        } catch (error) {
          console.error('❌ Exception vérification utilisateur:', error)
          // Continue même en cas d'erreur de vérification utilisateur
        }
        
        if (userExists && !force_create) {
          console.log('⚠️ Utilisateur existant trouvé')
          return new Response(JSON.stringify({
            success: false,
            error: 'user_already_exists',
            message: 'Un utilisateur avec cet email existe déjà'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
        
        // Générer un token unique
        const token = crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36)
        
        console.log('🔧 Force create:', force_create)
        
        // Si force_create est activé, marquer les anciennes invitations comme expirées
        if (force_create && existingInvitation) {
          console.log('🔄 Expiration des anciennes invitations')
          const { error: updateError } = await supabaseAdmin
            .from('user_invitations')
            .update({ 
              expires_at: new Date().toISOString(),
              is_used: true,
              used_at: new Date().toISOString()
            })
            .eq('email', email)
            .eq('is_used', false)
          
          if (updateError) {
            console.error('❌ Erreur expiration anciennes invitations:', updateError)
          }
        }
        
        console.log('➕ Création nouvelle invitation')
        
        // Créer l'invitation
        const { data: invitation, error: createError } = await supabaseAdmin
          .from('user_invitations')
          .insert({
            email,
            name,
            role,
            invitation_token: token,
            created_by,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
          })
          .select()
          .single()
        
        if (createError) {
          console.error('❌ Erreur création invitation:', createError)
          return new Response(JSON.stringify({
            success: false,
            error: 'creation_failed',
            message: 'Erreur lors de la création de l\'invitation',
            details: createError.message
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
        
        const invitationUrl = `https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/invite/${token}`
        
        console.log('✅ Invitation créée avec succès')
        
        return new Response(JSON.stringify({
          success: true,
          invitation,
          invitationUrl,
          userExists,
          message: userExists ? 'Invitation créée pour un utilisateur existant' : 'Invitation créée avec succès'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'validate_token': {
        const { token } = params
        
        const { data: invitation, error } = await supabaseAdmin
          .from('user_invitations')
          .select('*')
          .eq('invitation_token', token)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .single()
        
        if (error || !invitation) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Token d\'invitation invalide ou expiré'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }
        
        return new Response(JSON.stringify({
          success: true,
          invitation
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'complete_signup': {
        const { token, password } = params
        
        // Valider le token
        const { data: invitation, error: invitationError } = await supabaseAdmin
          .from('user_invitations')
          .select('*')
          .eq('invitation_token', token)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .single()
        
        if (invitationError || !invitation) {
          throw new Error('Token d\'invitation invalide ou expiré')
        }
        
        // Créer l'utilisateur
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: invitation.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: invitation.name,
            role: invitation.role
          }
        })
        
        if (authError) throw authError
        
        // Créer le profil
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: invitation.email,
            name: invitation.name,
            role: invitation.role
          })
        
        if (profileError) {
          console.warn('Erreur création profil:', profileError)
          // Ne pas bloquer si le profil existe déjà (trigger)
        }
        
        // Marquer l'invitation comme utilisée
        await supabaseAdmin
          .from('user_invitations')
          .update({
            is_used: true,
            used_at: new Date().toISOString()
          })
          .eq('invitation_token', token)
        
        return new Response(JSON.stringify({
          success: true,
          user: authData.user,
          message: 'Compte créé avec succès'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'unsupported_action',
          message: 'Action non supportée'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
    }
  } catch (error) {
    console.error('❌ ERREUR GLOBALE:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'server_error',
      message: error.message || 'Erreur inconnue',
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
