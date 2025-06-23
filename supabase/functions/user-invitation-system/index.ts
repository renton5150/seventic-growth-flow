
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
    const { action, ...params } = await req.json()
    
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
        
        // Vérifier s'il existe déjà une invitation active pour cet email
        const { data: existingInvitation } = await supabaseAdmin
          .from('user_invitations')
          .select('*')
          .eq('email', email)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .single()
        
        if (existingInvitation && !force_create) {
          return new Response(JSON.stringify({
            success: false,
            error: 'active_invitation_exists',
            invitation: existingInvitation,
            message: 'Une invitation active existe déjà pour cet email'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }
        
        // Vérifier si l'utilisateur existe déjà
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
          filter: `email.eq.${email}`
        })
        
        const userExists = existingUser && existingUser.users && existingUser.users.length > 0
        
        if (userExists && !force_create) {
          return new Response(JSON.stringify({
            success: false,
            error: 'user_already_exists',
            message: 'Un utilisateur avec cet email existe déjà. Utilisez l\'option "Forcer la création" si vous voulez créer une nouvelle invitation.'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }
        
        // Générer un token unique
        const token = crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36)
        
        // Si force_create est activé, marquer les anciennes invitations comme expirées
        if (force_create) {
          await supabaseAdmin
            .from('user_invitations')
            .update({ 
              expires_at: new Date().toISOString(),
              is_used: true,
              used_at: new Date().toISOString()
            })
            .eq('email', email)
            .eq('is_used', false)
        }
        
        // Créer l'invitation
        const { data: invitation, error } = await supabaseAdmin
          .from('user_invitations')
          .insert({
            email,
            name,
            role,
            invitation_token: token,
            created_by
          })
          .select()
          .single()
        
        if (error) throw error
        
        const invitationUrl = `https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/invite/${token}`
        
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
        throw new Error('Action non supportée')
    }
  } catch (error) {
    console.error('❌ ERREUR:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erreur inconnue'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
